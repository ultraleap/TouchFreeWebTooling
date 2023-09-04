import { AnalyticSessionEvents, AnalyticsSessionRequestType } from '../Analytics/AnalyticsTypes';
import { dispatchEventCallback } from '../TouchFreeEvents/TouchFreeEvents';
import { TrackingState } from '../Tracking/TrackingTypes';
import { ActionCode } from './ActionCode';
import { CallbackHandler, CallbackList } from './CallbackHandler';
import { Address, HandPresenceState, InteractionZoneState } from './ConnectionTypes';
import { MessageReceiver } from './MessageReceivers/BaseMessageReceiver';
import { HandDataHandler } from './MessageReceivers/HandDataHandler';
import { createMessageReceivers } from './MessageReceivers/index';
import {
    VersionHandshakeResponse,
    WebSocketResponse,
    ConfigState,
    ServiceStateResponse,
    TrackingStateResponse,
    TrackingStateRequest,
    TouchFreeRequest,
} from './RequestTypes';
import { CommunicationWrapper, VERSION_INFO } from './ServiceTypes';
import { v4 as uuidgen } from 'uuid';

/**
 * Represents a connection to the TouchFree Service.
 *
 * @internal
 */
export class ServiceConnection {
    /** The websocket connection object */
    webSocket: WebSocket;

    private handshakeRequested: boolean;
    private handshakeCompleted: boolean;
    private internalTouchFreeVersion = '';

    private currentHandPresence = HandPresenceState.HANDS_LOST;
    private currentInteractionZoneState = InteractionZoneState.HAND_EXITED;

    private readonly _callbackHandler: CallbackHandler;
    private readonly handDataHandler: HandDataHandler;

    private readonly messageReceivers: MessageReceiver[];

    /**
     * The version of the connected TouchFree Service
     */
    public get touchFreeVersion() {
        return this.internalTouchFreeVersion;
    }

    /**
     * Get current presence state of the hand.
     */
    public getCurrentHandPresence(): HandPresenceState {
        return this.currentHandPresence;
    }

    /**
     * Get current interaction zone state
     */
    public getCurrentInteractionZoneState(): InteractionZoneState {
        return this.currentInteractionZoneState;
    }

    /**
     * Has the websocket connection handshake completed?
     */
    public get handshakeComplete(): boolean {
        return this.handshakeCompleted;
    }

    public get callbackHandler(): CallbackHandler {
        return this._callbackHandler;
    }

    /**
     * Sets up {@link WebSocket} connection and adds appropriate listeners for incoming messages.
     *
     * @remarks
     * Sets up a listener to request a handshake once the websocket has successfully opened.
     * No data will be sent over an open connection until a successful handshake has completed.
     *
     * @param address - Address to connect to websocket on
     */
    constructor(address: Address) {
        this._callbackHandler = new CallbackHandler();
        this.messageReceivers = createMessageReceivers(this, this._callbackHandler);
        this.handDataHandler = new HandDataHandler();

        this.webSocket = new WebSocket(`ws://${address.ip}:${address.port}/connect`);
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
                    [VERSION_INFO.API_HEADER_NAME]: VERSION_INFO.API_VERSION,
                },
            };

            if (!this.handshakeRequested) {
                this.handshakeRequested = true;
                // send message
                this.sendMessageWithSimpleResponse(
                    JSON.stringify(handshakeRequest),
                    guid,
                    this.connectionResultCallback,
                    this._callbackHandler.handshakeCallbacks
                );
            }
        }
    };

    /**
     * Passed into {@link sendMessage} as part of connecting to TouchFree Service, handles the
     * result of the Version Checking handshake.
     *
     * @remarks
     * Dispatches `"onConnected"` event via {@link dispatchEventCallback} upon successful handshake response
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
            dispatchEventCallback('onConnected');
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
        receiver?.receiveMessage(looseData);
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
        this.sendMessageWithSimpleResponse(message, requestID, callback, this._callbackHandler.responseCallbacks);
    };

    private sendMessageWithSimpleResponse = <T extends WebSocketResponse>(
        message: string,
        requestID: string,
        callback?: (detail: WebSocketResponse | T) => void,
        callbacksStore?: CallbackList<WebSocketResponse>
    ): void => {
        if (!requestID) {
            if (callback) {
                callback({
                    requestID: '',
                    status: 'Failure',
                    message: 'Request failed. This is due to a missing or invalid requestID',
                    originalRequest: message,
                });
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
     * Request updated {@link ConfigState | ConfigState} from the Service
     *
     * @param callback - Callback to handle the response from the service
     */
    requestConfigState = (callback?: (detail: ConfigState) => void): void => {
        this.baseRequestWithRequiredCallback(
            ActionCode.REQUEST_CONFIGURATION_STATE,
            'config state',
            callback,
            this._callbackHandler.configStateCallbacks
        );
    };

    /**
     * Request Service to reset the Interaction Config File to its default state
     *
     * @param callback - Callback to handle the response from the service
     */
    resetInteractionConfigFile = (callback?: (defaultConfig: ConfigState) => void): void => {
        this.baseRequestWithRequiredCallback(
            ActionCode.RESET_INTERACTION_CONFIG_FILE,
            'config state',
            callback,
            this._callbackHandler.configStateCallbacks
        );
    };

    /**
     * Request service status from the Service.
     *
     * @param callback - Callback to handle the response from the service
     */
    requestServiceStatus = (callback?: (detail: ServiceStateResponse) => void): void => {
        this.baseRequestWithRequiredCallback(
            ActionCode.REQUEST_SERVICE_STATUS,
            'service status',
            callback,
            this._callbackHandler.serviceStatusCallbacks
        );
    };

    /**
     * Request config state of the config files from the Service
     *
     * @param callback - Callback to handle the response from the service
     */
    requestConfigFile = (callback?: (detail: ConfigState) => void): void => {
        this.baseRequestWithRequiredCallback(
            ActionCode.REQUEST_CONFIGURATION_FILE,
            'config file',
            callback,
            this._callbackHandler.configStateCallbacks
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
        this.baseRequestWithMultipleCallbacks(
            {
                position: atTopTarget ? 'Top' : 'Bottom',
            },
            ActionCode.QUICK_SETUP,
            this._callbackHandler.responseCallbacks,
            callback,
            this._callbackHandler.configStateCallbacks,
            configurationCallback
        );
    };

    /**
     * Request tracking state update from the Service
     *
     * @param callback - Callback to handle the response from the service
     */
    requestTrackingState = (callback?: (detail: TrackingStateResponse) => void) => {
        this.baseRequestWithRequiredCallback(
            ActionCode.GET_TRACKING_STATE,
            'tracking state',
            callback,
            this._callbackHandler.trackingStateCallbacks
        );
    };

    /**
     * Request a change to tracking state on the Service
     *
     * @param state - State change to request. Undefined props are not sent
     * @param callback - Callback to handle the response from the service
     */
    requestTrackingChange = (state: Partial<TrackingState>, callback?: (detail: TrackingStateResponse) => void) => {
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

        this.baseRequest(
            requestContent,
            ActionCode.SET_TRACKING_STATE,
            this._callbackHandler.trackingStateCallbacks,
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
    private baseRequestWithRequiredCallback = <TResponse>(
        actionCode: ActionCode,
        noCallbackError: string,
        callback?: (detail: TResponse) => void,
        callbackList?: CallbackList<TResponse>
    ) => {
        if (!callback || !callbackList) {
            console.error(`Request for ${noCallbackError} failed. This is due to a missing callback`);
            return;
        }

        this.baseRequest({}, actionCode, callbackList, callback);
    };

    /**
     * Base functionality for sending a request to the Service
     * @param fields - Object containing the content to send to the Service.
     * @param actionCode - {@link ActionCode} for the analytics request
     * @param callbackList - The list of pending callbacks to add the callback to
     * @param callback - Optional callback to handle the response from the service
     */
    private baseRequest = <T extends TouchFreeRequest, TResponse>(
        fields: Omit<T, 'requestID'>,
        actionCode: ActionCode,
        callbackList?: CallbackList<TResponse>,
        callback?: (detail: TResponse) => void
    ) => {
        this.baseRequestWithMultipleCallbacks(fields, actionCode, callbackList, callback);
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
    private baseRequestWithMultipleCallbacks = <T extends TouchFreeRequest, TResponse, TSecondResponse>(
        fields: Omit<T, 'requestID'>,
        actionCode: ActionCode,
        callbackList?: CallbackList<TResponse>,
        callback?: (detail: TResponse) => void,
        secondCallbackList?: CallbackList<TSecondResponse>,
        secondCallback?: (detail: TSecondResponse) => void
    ) => {
        const requestID = uuidgen();
        const content = { ...fields, requestID } as T;
        const wrapper: CommunicationWrapper<T> = { action: actionCode, content };
        const message = JSON.stringify(wrapper);

        if (callback && callbackList) {
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
        this.baseRequest(
            { sessionID, requestType },
            ActionCode.ANALYTICS_SESSION_REQUEST,
            this._callbackHandler.analyticsRequestCallbacks,
            callback
        );

    /**
     * Used to send a request to update the analytic session's events stored in the Service
     * @param sessionID - ID of the session
     * @param events - Analytics events to send
     * @param callback - Optional callback to handle the response from the service
     */
    updateAnalyticSessionEvents = (
        sessionID: string,
        events: AnalyticSessionEvents,
        callback?: (detail: WebSocketResponse) => void
    ) =>
        this.baseRequest(
            { sessionID, sessionEvents: events },
            ActionCode.ANALYTICS_UPDATE_SESSION_EVENTS_REQUEST,
            this._callbackHandler.analyticsRequestCallbacks,
            callback
        );

    /**
     * Handles HandPresence events from the service and dispatches
     * the `handFound` and `handsLost` events on this class
     * @param state - Hand state
     */
    handleHandPresenceEvent(state: HandPresenceState): void {
        this.currentHandPresence = state;

        if (state === HandPresenceState.HAND_FOUND) {
            dispatchEventCallback('handFound');
        } else {
            dispatchEventCallback('handsLost');
        }
    }

    /**
     * Handle an InteractionZone event by dispatching
     * `handEntered` and `handExited` events on this class
     */
    handleInteractionZoneEvent(state: InteractionZoneState): void {
        this.currentInteractionZoneState = state;

        if (state === InteractionZoneState.HAND_ENTERED) {
            dispatchEventCallback('handEntered');
        } else {
            dispatchEventCallback('handExited');
        }
    }
}

enum ServiceBinaryDataTypes {
    HAND_RENDER_DATA = 1,
}
