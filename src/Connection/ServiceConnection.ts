import TouchFree from '../TouchFree';
import { VersionInfo } from '../TouchFreeToolingTypes';
import { TrackingState } from '../Tracking/TrackingTypes';
import { ConnectionManager } from './ConnectionManager';
import { HandDataHandler, IBaseMessageReceiver } from './MessageReceivers';
import {
    ActionCode,
    CommunicationWrapper,
    ConfigState,
    ServiceStatus,
    AnalyticsSessionRequestType,
    AnalyticsSessionStateChangeRequest,
    TrackingStateRequest,
    TrackingStateResponse,
    VersionHandshakeResponse,
    WebSocketResponse,
    UpdateAnalyticSessionEventsRequest,
    CallbackList,
} from './TouchFreeServiceTypes';
import { v4 as uuidgen } from 'uuid';

// Class: ServiceConnection
// This represents a connection to a TouchFree Service. It should be created by a
// <ConnectionManager> to ensure there is only one active connection at a time. The sending
// and receiving of data to the Tooling is handled here as well as the creation of a
// <MessageReceiver> to ensure the data is handled properly.
export class ServiceConnection {
    // Group: Variables

    // Variable: webSocket
    // A reference to the websocket we are connected to.
    webSocket: WebSocket;

    private handshakeRequested: boolean;
    private handshakeCompleted: boolean;
    private _touchFreeVersion = '';

    private readonly handDataHandler: HandDataHandler;

    private readonly messageReceivers: IBaseMessageReceiver[];

    // Variable: touchFreeVersion
    // The version of the connected TouchFree Service
    public get touchFreeVersion(): string {
        return this._touchFreeVersion;
    }

    public get handshakeComplete(): boolean {
        return this.handshakeCompleted;
    }

    // Group: Functions

    // Function: constructor
    // The constructor for <ServiceConnection> that can be given a different IP Address and Port
    // to connect to on construction. This constructor also sets up the redirects of incoming
    // messages to <OnMessage>. Puts a listener on the websocket so that once it opens, a handshake
    // request is sent with this Tooling's API version number. The service will not send data over
    // an open connection until this handshake is completed successfully.
    constructor(
        messageReceivers: IBaseMessageReceiver[],
        handDataHandler: HandDataHandler,
        _ip = '127.0.0.1',
        _port = '9739'
    ) {
        this.messageReceivers = messageReceivers;
        this.handDataHandler = handDataHandler;

        this.webSocket = new WebSocket(`ws://${_ip}:${_port}/connect`);
        this.webSocket.binaryType = 'arraybuffer';

        this.webSocket.addEventListener('message', this.OnMessage);

        this.handshakeRequested = false;
        this.handshakeCompleted = false;

        this.webSocket.addEventListener('open', this.RequestHandshake, { once: true });
    }

    // Function: Disconnect
    // Can be used to force the connection to the <webSocket> to be closed.
    Disconnect = (): void => {
        if (this.webSocket !== null) {
            this.webSocket.close();
        }
    };

    private RequestHandshake = () => {
        if (!this.handshakeCompleted) {
            const guid: string = uuidgen();

            // construct message
            const handshakeRequest: CommunicationWrapper<{ [key: string]: string }> = {
                action: ActionCode.VERSION_HANDSHAKE,
                content: {
                    requestID: guid,
                },
            };

            handshakeRequest.content[VersionInfo.API_HEADER_NAME] = VersionInfo.ApiVersion;

            if (!this.handshakeRequested) {
                this.handshakeRequested = true;
                // send message
                this.sendMessageWithSimpleResponse(
                    JSON.stringify(handshakeRequest),
                    guid,
                    this.ConnectionResultCallback,
                    ConnectionManager.callbackHandler.handshakeCallbacks
                );
            }
        }
    };

    // Function: ConnectionResultCallback
    // Passed into <SendMessage> as part of connecting to TouchFree Service, handles the
    // result of the Version Checking handshake.
    private ConnectionResultCallback = (response: VersionHandshakeResponse | WebSocketResponse): void => {
        if (response.status === 'Success') {
            console.log('Successful Connection');
            const handshakeResponse = response as VersionHandshakeResponse;
            if (handshakeResponse) {
                this._touchFreeVersion = handshakeResponse.touchFreeVersion;
            }

            this.handshakeCompleted = true;
            TouchFree.DispatchEvent('OnConnected');
        } else {
            console.error(`Connection to Service failed. Details:\n${response.message}`);
        }
    };

    // Function: OnMessage
    // The first point of contact for new messages received, these are sorted into appropriate
    // types based on their <ActionCode> and added to queues on the <ConnectionManager's>
    // <MessageReceiver>.
    OnMessage = (_message: MessageEvent): void => {
        if (typeof _message.data !== 'string') {
            const buffer = _message.data as ArrayBuffer;
            const binaryDataType = new Int32Array(buffer, 0, 4)[0];
            if (binaryDataType === ServiceBinaryDataTypes.HandRenderData) {
                this.handDataHandler.latestHandDataItem = buffer;
            }
            return;
        }

        const looseData: CommunicationWrapper<unknown> = JSON.parse(_message.data);

        // Get the first message receiver with a matching action code
        const receiver = this.messageReceivers.find((x) => x.actionCode.find((a) => a === looseData.action));
        receiver?.ReceiveMessage(looseData);
    };

    // Function: SendMessage
    // Used internally to send or request information from the Service via the <webSocket>. To
    // be given a pre-made _message and _requestID. Provides an asynchronous <WebSocketResponse>
    // via the _callback parameter.
    //
    // If your _callback requires context it should be bound to that context via .bind()
    SendMessage = <T extends WebSocketResponse>(
        _message: string,
        _requestID: string,
        _callback: ((detail: WebSocketResponse | T) => void) | null
    ): void => {
        this.sendMessageWithSimpleResponse(
            _message,
            _requestID,
            _callback,
            ConnectionManager.callbackHandler.responseCallbacks
        );
    };

    private sendMessageWithSimpleResponse = <T extends WebSocketResponse>(
        _message: string,
        _requestID: string,
        _callback: ((detail: WebSocketResponse | T) => void) | null,
        _callbacksStore: CallbackList<WebSocketResponse>
    ): void => {
        if (!_requestID) {
            if (_callback) {
                const response: WebSocketResponse = new WebSocketResponse(
                    '',
                    'Failure',
                    'Request failed. This is due to a missing or invalid requestID',
                    _message
                );
                _callback(response);
            }

            console.error('Request failed. This is due to a missing or invalid requestID');
            return;
        }

        if (_callback) {
            _callbacksStore[_requestID] = { timestamp: Date.now(), callback: _callback };
        }

        this.webSocket.send(_message);
    };

    // Function: RequestConfigState
    // Used internally to request information from the Service via the <webSocket>.
    // Provides an asynchronous <ConfigState> via the _callback parameter.
    //
    // If your _callback requires context it should be bound to that context via .bind()
    RequestConfigState = (_callback: (detail: ConfigState) => void): void => {
        this.sendRequest(
            ActionCode.REQUEST_CONFIGURATION_STATE,
            'config state',
            _callback,
            ConnectionManager.callbackHandler.configStateCallbacks
        );
    };

    private sendRequest = <TResponse>(
        actionCode: ActionCode,
        noCallbackError: string,
        _callback: (detail: TResponse) => void,
        callbackList: CallbackList<TResponse>
    ) => {
        if (_callback === null) {
            console.error(`Request for ${noCallbackError} failed. This is due to a missing callback`);
            return;
        }

        const guid: string = uuidgen();
        const request = { requestID: guid };
        const wrapper = new CommunicationWrapper<unknown>(actionCode, request);
        const message: string = JSON.stringify(wrapper);

        callbackList[guid] = { timestamp: Date.now(), callback: _callback };

        this.webSocket.send(message);
    };

    // Function: ResetInteractionConfigFile
    // Used internally to request that the Service resets the Interaction Config File to
    // its default state. Provides the Default <InteractionConfigFull> returned by the Service
    // once the reset is complete.
    //
    // If your _callback requires context it should be bound to that context via .bind()
    ResetInteractionConfigFile = (_callback: (defaultConfig: ConfigState) => void): void => {
        this.sendRequest(
            ActionCode.RESET_INTERACTION_CONFIG_FILE,
            'config state',
            _callback,
            ConnectionManager.callbackHandler.configStateCallbacks
        );
    };

    // Function: RequestServiceStatus
    // Used internally to request information from the Service via the <webSocket>.
    // Provides an asynchronous <ServiceStatus> via the _callback parameter.
    //
    // If your _callback requires context it should be bound to that context via .bind()
    RequestServiceStatus = (_callback: (detail: ServiceStatus) => void): void => {
        this.sendRequest(
            ActionCode.REQUEST_SERVICE_STATUS,
            'service status',
            _callback,
            ConnectionManager.callbackHandler.serviceStatusCallbacks
        );
    };

    // Function: RequestConfigFile
    // Used internally to request information from the Service via the <webSocket>.
    // Provides an asynchronous <ConfigState> via the _callback parameter.
    //
    // If your _callback requires context it should be bound to that context via .bind()
    RequestConfigFile = (_callback: (detail: ConfigState) => void): void => {
        this.sendRequest(
            ActionCode.REQUEST_CONFIGURATION_FILE,
            'config file',
            _callback,
            ConnectionManager.callbackHandler.configStateCallbacks
        );
    };

    // Function: QuickSetupRequest
    // Used internally to pass information to the Service about performing a QuickSetup
    // via the <webSocket>.
    // Provides an asynchronous <WebSocketResponse> via the _callback parameter.
    // Provides an asynchronous <ConfigState> via the _configurationCallback parameter.
    //
    // If your _callback requires context it should be bound to that context via .bind()
    // If your _configurationCallback requires context it should be bound to that context via .bind()
    QuickSetupRequest = (
        atTopTarget: boolean,
        _callback: (detail: WebSocketResponse) => void,
        _configurationCallback: (detail: ConfigState) => void
    ): void => {
        const position = atTopTarget ? 'Top' : 'Bottom';
        const guid: string = uuidgen();

        const request = {
            requestID: guid,
            position,
        };
        const wrapper = new CommunicationWrapper(ActionCode.QUICK_SETUP, request);
        const message: string = JSON.stringify(wrapper);

        if (_callback !== null) {
            ConnectionManager.callbackHandler.responseCallbacks[guid] = { timestamp: Date.now(), callback: _callback };
        }

        if (_configurationCallback !== null) {
            ConnectionManager.callbackHandler.configStateCallbacks[guid] = {
                timestamp: Date.now(),
                callback: _configurationCallback,
            };
        }

        this.webSocket.send(message);
    };

    // Function: RequestTrackingState
    // Used internally to request information from the Service via the <webSocket>.
    // Provides an asynchronous <TrackingStateResponse> via the _callback parameter.
    //
    // If your _callback requires context it should be bound to that context via .bind()
    RequestTrackingState = (_callback: (detail: TrackingStateResponse) => void) => {
        this.sendRequest(
            ActionCode.GET_TRACKING_STATE,
            'tracking state',
            _callback,
            ConnectionManager.callbackHandler.trackingStateCallbacks
        );
    };

    // Function: RequestTrackingChange
    // Used internally to update the configuration of the Tracking via the <webSocket>.
    // Provides an asynchronous <TrackingStateResponse> via the _callback parameter.
    //
    // If your _callback requires context it should be bound to that context via .bind()
    RequestTrackingChange = (
        _state: Partial<TrackingState>,
        _callback: ((detail: TrackingStateResponse) => void) | null
    ) => {
        const requestID = uuidgen();
        const requestContent: Partial<TrackingStateRequest> = {
            requestID,
        };

        if (_state.mask !== undefined) {
            requestContent.mask = _state.mask;
        }

        if (_state.allowImages !== undefined) {
            requestContent.allowImages = _state.allowImages;
        }

        if (_state.cameraReversed !== undefined) {
            requestContent.cameraReversed = _state.cameraReversed;
        }

        if (_state.analyticsEnabled !== undefined) {
            requestContent.analyticsEnabled = _state.analyticsEnabled;
        }

        const wrapper: CommunicationWrapper<Partial<TrackingStateRequest>> = new CommunicationWrapper<
            Partial<TrackingStateRequest>
        >(ActionCode.SET_TRACKING_STATE, requestContent);
        const message: string = JSON.stringify(wrapper);

        if (_callback !== null) {
            ConnectionManager.callbackHandler.trackingStateCallbacks[requestID] = {
                timestamp: Date.now(),
                callback: _callback,
            };
        }

        this.webSocket.send(message);
    };

    // Function: BaseAnalyticsRequest
    // Base functionality for sending an analytics request to the Service
    private BaseAnalyticsRequest = <T extends UpdateAnalyticSessionEventsRequest | AnalyticsSessionStateChangeRequest>(
        fields: Omit<T, 'requestID'>,
        actionCode: ActionCode,
        callback?: (detail: WebSocketResponse) => void
    ) => {
        const requestID = uuidgen();
        const content = { ...fields, requestID } as T;
        const wrapper = new CommunicationWrapper<T>(actionCode, content);
        const message = JSON.stringify(wrapper);

        if (callback) {
            ConnectionManager.callbackHandler.analyticsRequestCallbacks[requestID] = {
                timestamp: Date.now(),
                callback,
            };
        }

        this.webSocket.send(message);
    };

    // Function: AnalyticsSessionRequest
    // Used to either start a new analytics session, or stop the current session.
    AnalyticsSessionRequest = (
        requestType: AnalyticsSessionRequestType,
        sessionID: string,
        callback?: (detail: WebSocketResponse) => void
    ) =>
        this.BaseAnalyticsRequest<AnalyticsSessionStateChangeRequest>(
            { sessionID, requestType },
            ActionCode.ANALYTICS_SESSION_REQUEST,
            callback
        );

    // Function: UpdateAnalyticSessionEvents
    // Used to send a request to update the analytic session's events stored in the Service
    UpdateAnalyticSessionEvents = (sessionID: string, callback?: (detail: WebSocketResponse) => void) =>
        this.BaseAnalyticsRequest<UpdateAnalyticSessionEventsRequest>(
            { sessionID, sessionEvents: TouchFree.GetAnalyticSessionEvents() },
            ActionCode.ANALYTICS_UPDATE_SESSION_EVENTS_REQUEST,
            callback
        );
}

enum ServiceBinaryDataTypes {
    HandRenderData = 1,
}
