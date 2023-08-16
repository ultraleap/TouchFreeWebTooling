import * as TouchFree from '../TouchFree';
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
    private internalTouchFreeVersion = '';

    private readonly handDataHandler: HandDataHandler;

    private readonly messageReceivers: IBaseMessageReceiver[];

    /**
     * The version of the connected TouchFree Service
     */
    public get touchFreeVersion() {
        return this.internalTouchFreeVersion;
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
     * @param ip - Optional override to default websocket ip '127.0.0.1'
     * @param port - Optional override to default websocket port '9739'
     */
    constructor(
        messageReceivers: IBaseMessageReceiver[],
        handDataHandler: HandDataHandler,
        _ip = '127.0.0.1',
        _port = '9739'
    ) {
        this.messageReceivers = messageReceivers;
        this.handDataHandler = handDataHandler;

        this.webSocket = new WebSocket(`ws://${ip}:${port}/connect`);
        this.webSocket.binaryType = 'arraybuffer';

        this.webSocket.addEventListener('message', this.onMessage);

        this.handshakeRequested = false;
        this.handshakeCompleted = false;

        this.webSocket.addEventListener('open', this.requestHandshake, { once: true });
    }

    /**
     * Force close the websocket connection
     */
    disconnect = (): void => {
        if (this.webSocket !== null) {
            this.webSocket.close();
        }
    };

    private requestHandshake = () => {
        if (!this.handshakeCompleted) {
            const guid = uuidgen();

            // construct message
            const handshakeRequest: CommunicationWrapper<{ [key: string]: string }> = {
                action: ActionCode.VERSION_HANDSHAKE,
                content: {
                    requestID: guid,
                    [VersionInfo.API_HEADER_NAME]: VersionInfo.API_VERSION,
                },
            };

            if (!this.handshakeRequested) {
                this.handshakeRequested = true;
                // send message
                this.sendMessageWithSimpleResponse(
                    JSON.stringify(handshakeRequest),
                    guid,
                    this.connectionResultCallback,
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
     * Dispatches `"onConnected"` event via {@link TouchFree.dispatchEvent} upon successful handshake response
     *
     * @param response - VersionHandshakeResponse if connection was successful or another websocket response otherwise
     */
    private connectionResultCallback = (response: VersionHandshakeResponse | WebSocketResponse): void => {
        if (response.status === 'Success') {
            console.log('Successful Connection');
            const handshakeResponse = response as VersionHandshakeResponse;
            if (handshakeResponse) {
                this.internalTouchFreeVersion = handshakeResponse.touchFreeVersion;
            }

            this.handshakeCompleted = true;
            TouchFree.dispatchEvent('onConnected');
        } else {
            console.error(`Connection to Service failed. Details:\n${response.message}`);
        }
    };

    /**
     * The first point of contact for new messages received. Messages are passed to a
     * message receiver depending on their {@link ActionCode}.
     *
     * @param message - Message to handle
     */
    onMessage = (message: MessageEvent): void => {
        if (typeof message.data !== 'string') {
            const buffer = message.data as ArrayBuffer;
            const binaryDataType = new Int32Array(buffer, 0, 4)[0];
            if (binaryDataType === ServiceBinaryDataTypes.HAND_RENDER_DATA) {
                this.handDataHandler.latestHandDataItem = buffer;
            }
            return;
        }

        const looseData: CommunicationWrapper<unknown> = JSON.parse(message.data);

        // Get the first message receiver with a matching action code
        const receiver = this.messageReceivers.find((x) => x.actionCode.find((a) => a === looseData.action));
        receiver?.ReceiveMessage(looseData);
    };

    /**
     * Send or request information from the TouchFree Service via the WebSocket.
     *
     * @param message - Content of message
     * @param requestID - A request ID to identify the response from the Service
     * @param callback - Callback to handle the response
     */
    sendMessage = <T extends WebSocketResponse>(
        message: string,
        requestID: string,
        callback?: (detail: WebSocketResponse | T) => void
    ): void => {
        this.sendMessageWithSimpleResponse(
            message,
            requestID,
            callback,
            ConnectionManager.callbackHandler.responseCallbacks
        );
    };

    private sendMessageWithSimpleResponse = <T extends WebSocketResponse>(
        message: string,
        requestID: string,
        callback?: (detail: WebSocketResponse | T) => void,
        callbacksStore?: CallbackList<WebSocketResponse>
    ): void => {
        if (!requestID) {
            if (callback) {
                const response = new WebSocketResponse(
                    '',
                    'Failure',
                    'Request failed. This is due to a missing or invalid requestID',
                    message
                );
                callback(response);
            }

            console.error('Request failed. This is due to a missing or invalid requestID');
            return;
        }

        if (callback && callbacksStore) {
            callbacksStore[requestID] = { timestamp: Date.now(), callback };
        }

        this.webSocket.send(message);
    };

    /**
     * Request updated {@link Connection.ConfigState | ConfigState} from the Service
     *
     * @param callback - Callback to handle the response from the service
     */
    requestConfigState = (callback?: (detail: ConfigState) => void): void => {
        this.BaseRequestWithRequiredCallback(
            ActionCode.REQUEST_CONFIGURATION_STATE,
            'config state',
            callback,
            ConnectionManager.callbackHandler.configStateCallbacks
        );
    };

    /**
     * Request Service to reset the Interaction Config File to its default state
     *
     * @param callback - Callback to handle the response from the service
     */
    resetInteractionConfigFile = (callback: (defaultConfig: ConfigState) => void): void => {
        this.BaseRequestWithRequiredCallback(
            ActionCode.RESET_INTERACTION_CONFIG_FILE,
            'config state',
            callback,
            ConnectionManager.callbackHandler.configStateCallbacks
        );
    };

    /**
     * Request service status from the Service.
     *
     * @param callback - Callback to handle the response from the service
     */
    requestServiceStatus = (callback?: (detail: ServiceStatus) => void): void => {
        this.BaseRequestWithRequiredCallback(
            ActionCode.REQUEST_SERVICE_STATUS,
            'service status',
            callback,
            ConnectionManager.callbackHandler.serviceStatusCallbacks
        );
    };

    /**
     * Request config state of the config files from the Service
     *
     * @param callback - Callback to handle the response from the service
     */
    requestConfigFile = (callback?: (detail: ConfigState) => void): void => {
        this.BaseRequestWithRequiredCallback(
            ActionCode.REQUEST_CONFIGURATION_FILE,
            'config file',
            callback,
            ConnectionManager.callbackHandler.configStateCallbacks
        );
    };

    /**
     * Request a quick setup on the Service
     *
     * @param atTopTarget - Which quick setup target is being used
     * @param callback - Callback to handle the response from the service
     * @param configurationCallback - Callback to handle a response from the service with updated configuration
     */
    quickSetupRequest = (
        atTopTarget: boolean,
        callback?: (detail: WebSocketResponse) => void,
        configurationCallback?: (detail: ConfigState) => void
    ): void => {
        this.BaseRequestWithMultipleCallbacks(
            {
                position: atTopTarget ? 'Top' : 'Bottom',
            },
            ActionCode.QUICK_SETUP,
            ConnectionManager.callbackHandler.responseCallbacks,
            callback,
            ConnectionManager.callbackHandler.configStateCallbacks,
            configurationCallback
        );
    };

    /**
     * Request tracking state update from the Service
     *
     * @param callback - Callback to handle the response from the service
     */
    requestTrackingState = (callback?: (detail: TrackingStateResponse) => void) => {
        this.BaseRequestWithRequiredCallback(
            ActionCode.GET_TRACKING_STATE,
            'tracking state',
            callback,
            ConnectionManager.callbackHandler.trackingStateCallbacks
        );
    };

    /**
     * Request a change to tracking state on the Service
     *
     * @param state - State change to request. Undefined props are not sent
     * @param callback - Callback to handle the response from the service
     */
    requestTrackingChange = (
        state: Partial<TrackingState>,
        callback?: ((detail: TrackingStateResponse) => void)
    ) => {
        const requestContent: Partial<TrackingStateRequest> = {};

        if (state.mask !== undefined) {
            requestContent.mask = state.mask;
        }

        if (state.allowImages !== undefined) {
            requestContent.allowImages = state.allowImages;
        }

        if (state.cameraReversed !== undefined) {
            requestContent.cameraReversed = state.cameraReversed;
        }

        if (state.analyticsEnabled !== undefined) {
            requestContent.analyticsEnabled = state.analyticsEnabled;
        }

        this.BaseRequest(
            requestContent,
            ActionCode.SET_TRACKING_STATE,
            ConnectionManager.callbackHandler.trackingStateCallbacks,
            callback
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
    };

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

    /**
     * Used to either start a new analytics session, or stop the current session.
     *
     * @param requestType - Type of Analytics Session request. See {@link AnalyticsSessionRequestType}
     * @param sessionID - Session ID
     * @param callback - Optional callback to handle the response from the service
     */
    analyticsSessionRequest = (
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
    updateAnalyticSessionEvents = (sessionID: string, callback?: (detail: WebSocketResponse) => void) =>
        this.BaseRequest(
            { sessionID, sessionEvents: TouchFree.GetAnalyticSessionEvents() },
            ActionCode.ANALYTICS_UPDATE_SESSION_EVENTS_REQUEST,
            ConnectionManager.callbackHandler.analyticsRequestCallbacks,
            callback
        );
}

enum ServiceBinaryDataTypes {
    HAND_RENDER_DATA = 1,
}
