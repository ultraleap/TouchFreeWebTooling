import TouchFree, { DispatchEvent } from '../TouchFree';
import { VersionInfo, WebsocketInputAction } from '../TouchFreeToolingTypes';
import { TrackingState } from '../Tracking/TrackingTypes';
import { ConnectionManager } from './ConnectionManager';
import { HandDataHandler, IBaseMessageReceiver } from './MessageReceivers';
import {
    ActionCode,
    CommunicationWrapper,
    ConfigState,
    ServiceStatus,
    AnalyticsSessionRequestType,
    TrackingStateRequest,
    TrackingStateResponse,
    VersionHandshakeResponse,
    WebSocketResponse,
    CallbackList,
    TouchFreeRequest,
} from './TouchFreeServiceTypes';
import { v4 as uuidgen } from 'uuid';

/**
 * Represents a connection to the TouchFree Service.
 *
 * @remarks
 * Typically only a single instance of this class exists, managed by
 * the {@link ConnectionManager}.
 *
 * @internal
 */
export class ServiceConnection {
    /** The websocket connection object */
    webSocket: WebSocket;

    private handshakeRequested: boolean;
    private handshakeCompleted: boolean;
    private _touchFreeVersion = '';

    private readonly handDataHandler: HandDataHandler;

    private readonly messageReceivers: IBaseMessageReceiver[];

    /**
     * The version of the connected TouchFree Service
     */
    public get touchFreeVersion(): string {
        return this._touchFreeVersion;
    }

    /**
     * Has the websocket connection handshake completed?
     */
    public get handshakeComplete(): boolean {
        return this.handshakeCompleted;
    }

    /**
     * Sets up {@link WebSocket} connection and adds appropriate listeners for incoming messages.
     *
     * @remarks
     * Sets up a listener to request a handshake once the websocket has successfully opened.
     * No data will be sent over an open connection until a successful handshake has completed.
     *
     * @param messageReceivers - The collection of message receivers to handle messages received on this connection.
     * @param handDataHandler - The handler for hand data received on this connection.
     * @param _ip - Optional override to default websocket ip '127.0.0.1'
     * @param _port - Optional override to default websocket port '9739'
     */
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

    /**
     * Force close the websocket connection
     */
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
                    [VersionInfo.API_HEADER_NAME]: VersionInfo.ApiVersion,
                },
            };

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

    /**
     * Passed into {@link SendMessage} as part of connecting to TouchFree Service, handles the
     * result of the Version Checking handshake.
     *
     * @remarks
     * Dispatches `"OnConnected"` event via {@link TouchFree.DispatchEvent} upon successful handshake response
     *
     * @param response - VersionHandshakeResponse if connection was successful or another websocket response otherwise
     */
    private ConnectionResultCallback = (response: VersionHandshakeResponse | WebSocketResponse): void => {
        if (response.status === 'Success') {
            console.log('Successful Connection');
            const handshakeResponse = response as VersionHandshakeResponse;
            if (handshakeResponse) {
                this._touchFreeVersion = handshakeResponse.touchFreeVersion;
            }

            this.handshakeCompleted = true;
            DispatchEvent('OnConnected');
        } else {
            console.error(`Connection to Service failed. Details:\n${response.message}`);
        }
    };

    /**
     * The first point of contact for new messages received. Messages are handled differently
     * based on their {@link ActionCode}, typically being sent to a queue or handler in
     * {@link ConnectionManager.messageReceiver}.
     *
     * @param _message - Message to handle
     */
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

    /**
     * Send or request information from the TouchFree Service via the WebSocket.
     *
     * @param _message - Content of message
     * @param _requestID - A request ID to identify the response from the Service
     * @param _callback - Callback to handle the response
     */
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

    /**
     * Request updated {@link ConfigState} from the Service
     *
     * @param _callback - Callback to handle the response from the service
     */
    RequestConfigState = (_callback: (detail: ConfigState) => void): void => {
        this.BaseRequestWithRequiredCallback(
            ActionCode.REQUEST_CONFIGURATION_STATE,
            'config state',
            _callback,
            ConnectionManager.callbackHandler.configStateCallbacks
        );
    };

    /**
     * Request Service to reset the Interaction Config File to its default state
     *
     * @param _callback - Callback to handle the response from the service
     */
    ResetInteractionConfigFile = (_callback: (defaultConfig: ConfigState) => void): void => {
        this.BaseRequestWithRequiredCallback(
            ActionCode.RESET_INTERACTION_CONFIG_FILE,
            'config state',
            _callback,
            ConnectionManager.callbackHandler.configStateCallbacks
        );
    };

    /**
     * Request service status from the Service.
     *
     * @param _callback - Callback to handle the response from the service
        this.BaseRequestWithRequiredCallback(
            ActionCode.REQUEST_SERVICE_STATUS,
            'service status',
            _callback,
            ConnectionManager.callbackHandler.serviceStatusCallbacks
            Date.now(),
            _callback
        );
    };

    /**
     * Request config state of the config files from the Service
     *
     * @param _callback - Callback to handle the response from the service
     */
    RequestConfigFile = (_callback: (detail: ConfigState) => void): void => {
        this.BaseRequestWithRequiredCallback(
            ActionCode.REQUEST_CONFIGURATION_FILE,
            'config file',
            _callback,
            ConnectionManager.callbackHandler.configStateCallbacks
        );
    };

    /**
     * Request a quick setup on the Service
     *
     * @param atTopTarget - Which quick setup target is being used
     * @param _callback - Callback to handle the response from the service
     * @param _configurationCallback - Callback to handle a response from the service with updated configuration
     */
    QuickSetupRequest = (
        atTopTarget: boolean,
        _callback: (detail: WebSocketResponse) => void,
        _configurationCallback: (detail: ConfigState) => void
    ): void => {
        this.BaseRequestWithMultipleCallbacks(
            {
                position: atTopTarget ? 'Top' : 'Bottom',
            },
            ActionCode.QUICK_SETUP,
            ConnectionManager.callbackHandler.responseCallbacks,
            _callback,
            ConnectionManager.callbackHandler.configStateCallbacks,
            _configurationCallback
        );
    };

    /**
     * Request tracking state update from the Service
     *
     * @param _callback - Callback to handle the response from the service
     */
    RequestTrackingState = (_callback: (detail: TrackingStateResponse) => void) => {
        this.BaseRequestWithRequiredCallback(
            ActionCode.GET_TRACKING_STATE,
            'tracking state',
            _callback,
            ConnectionManager.callbackHandler.trackingStateCallbacks
        );
    };

    /**
     * Request a change to tracking state on the Service
     *
     * @param _state - State change to request. Undefined props are not sent
     * @param _callback - Callback to handle the response from the service
     */
    RequestTrackingChange = (
        _state: Partial<TrackingState>,
        _callback: ((detail: TrackingStateResponse) => void) | null
    ) => {
        const requestContent: Partial<TrackingStateRequest> = {};

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

        this.BaseRequest(
            requestContent,
            ActionCode.SET_TRACKING_STATE,
            ConnectionManager.callbackHandler.trackingStateCallbacks,
            _callback
        );
    };


    /**
     * Base functionality for sending a request to the Service
     * @param fields - Object containing the content to send to the Service.
     * @param actionCode - {@link ActionCode} for the analytics request
     * @param callback - A callback to handle the response from the service.
     * @param callbackList - The list of pending callbacks to add the callback to
     */
    private BaseRequestWithRequiredCallback = <TResponse>(
        actionCode: ActionCode,
        noCallbackError: string,
        callback: (detail: TResponse) => void,
        callbackList: CallbackList<TResponse>
    ) => {
        if (!callback) {
            console.error(`Request for ${noCallbackError} failed. This is due to a missing callback`);
            return;
        }

        this.BaseRequest({}, actionCode, callbackList, callback);
    };

    /**
     * Base functionality for sending a request to the Service
     * @param fields - Object containing the content to send to the Service.
     * @param actionCode - {@link ActionCode} for the analytics request
     * @param callbackList - The list of pending callbacks to add the callback to
     * @param callback - Optional callback to handle the response from the service
     */
    private BaseRequest = <T extends TouchFreeRequest, TResponse>(
        fields: Omit<T, 'requestID'>,
        actionCode: ActionCode,
        callbackList: CallbackList<TResponse>,
        callback?: ((detail: TResponse) => void) | null
    ) => {
        this.BaseRequestWithMultipleCallbacks(fields, actionCode, callbackList, callback);

    /**
     * Base functionality for sending a request to the Service
     * @param fields - Object containing the content to send to the Service.
     * @param actionCode - {@link ActionCode} for the analytics request
     * @param callbackList - The list of pending callbacks to add the callback to
     * @param callback - Optional callback to handle the response from the service
     * @param secondCallbackList - Optional second list of pending callbacks to add the seconds callback to
     * @param secondCallback - Optional second callback to handle the response from the service
     */
    private BaseRequestWithMultipleCallbacks = <T extends TouchFreeRequest, TResponse, TSecondResponse>(
        fields: Omit<T, 'requestID'>,
        actionCode: ActionCode,
        callbackList: CallbackList<TResponse>,
        callback?: ((detail: TResponse) => void) | null,
        secondCallbackList?: CallbackList<TSecondResponse>,
        secondCallback?: ((detail: TSecondResponse) => void) | null
    ) => {
        const requestID = uuidgen();
        const content = { ...fields, requestID } as T;
        const wrapper = new CommunicationWrapper<T>(actionCode, content);
        const message = JSON.stringify(wrapper);

        if (callback) {
            callbackList[requestID] = {
                timestamp: Date.now(),
                callback,
            };
        }

        if (secondCallback && secondCallbackList) {
            secondCallbackList[requestID] = {
                timestamp: Date.now(),
                callback: secondCallback,
            };
        }

        this.webSocket.send(message);
    };

    // Function: AnalyticsSessionRequest
    // Used to either start a new analytics session, or stop the current session.
    /**
     * Used to either start a new analytics session, or stop the current session.
     *
     * @param requestType - Type of Analytics Session request. See {@link AnalyticsSessionRequestType}
     * @param sessionID - Session ID
     * @param callback - Optional callback to handle the response from the service
     */
    AnalyticsSessionRequest = (
        requestType: AnalyticsSessionRequestType,
        sessionID: string,
        callback?: (detail: WebSocketResponse) => void
    ) =>
        this.BaseRequest(
            { sessionID, requestType },
            ActionCode.ANALYTICS_SESSION_REQUEST,
            ConnectionManager.callbackHandler.analyticsRequestCallbacks,
            callback
        );

    /**
     * Used to send a request to update the analytic session's events stored in the Service
     * @param sessionID - ID of the session
     * @param callback - Optional callback to handle the response from the service
     */
    UpdateAnalyticSessionEvents = (sessionID: string, callback?: (detail: WebSocketResponse) => void) =>
        this.BaseRequest(
            { sessionID, sessionEvents: TouchFree.GetAnalyticSessionEvents() },
            ActionCode.ANALYTICS_UPDATE_SESSION_EVENTS_REQUEST,
            ConnectionManager.callbackHandler.analyticsRequestCallbacks,
            callback
        );
}

enum ServiceBinaryDataTypes {
    HandRenderData = 1,
}
