import { AnalyticSessionEvents, AnalyticsSessionRequestType } from '../Analytics/AnalyticsTypes';
import { dispatchEventCallback } from '../TouchFreeEvents/TouchFreeEvents';
import { TrackingState } from '../Tracking/TrackingTypes';
import { ActionCode } from './ActionCode';
import { CallbackList, CallbackLists, createDefaultCallbackLists, setClearCallbacksInterval } from './CallbackLists';
import { Address, HandPresenceState, InteractionZoneState } from './ConnectionTypes';
import { AnalyticsMessageReceiver } from './MessageReceivers/AnalyticsMessageReceiver';
import { MessageReceiver } from './MessageReceivers/BaseMessageReceiver';
import { ConfigStateMessageReceiver } from './MessageReceivers/ConfigStateMessageReceiver';
import { HandDataHandler } from './MessageReceivers/HandDataHandler';
import { HandPresenceMessageReceiver } from './MessageReceivers/HandPresenceMessageReceiver';
import { InputActionMessageReceiver } from './MessageReceivers/InputActionMessageReceiver';
import { InteractionZoneMessageReceiver } from './MessageReceivers/InteractionZoneMessageReceiver';
import {
    LicensingChangeResponseMessageReceiver
} from './MessageReceivers/LicensingMessageReceivers/LicenseChangeResponseReceiver';
import {
    LicensingStateMessageReceiver
} from './MessageReceivers/LicensingMessageReceivers/LicenseStateMessageReceiver';
import {
    LicensingStateResponseMessageReceiver
} from './MessageReceivers/LicensingMessageReceivers/LicenseStateResponseMessageReceiver';
import { ResponseMessageReceiver } from './MessageReceivers/ResponseMessageReceiver';
import { ServiceStateMessageReceiver } from './MessageReceivers/ServiceStateMessageReceiver';
import { TrackingStateMessageReceiver } from './MessageReceivers/TrackingStateMessageReceiver';
import { VersionHandshakeMessageReceiver } from './MessageReceivers/VersionHandshakeMessageReceiver';
import {
    VersionHandshakeResponse,
    WebSocketResponse,
    ConfigState,
    ServiceStateResponse,
    TrackingStateResponse,
    TrackingStateRequest,
    TouchFreeRequest,
    LicenseChangeResponse,
    LicenseStateResponse,
} from './RequestTypes';
import { CommunicationWrapper, VERSION_INFO } from './ServiceTypes';
import { v4 as uuidgen } from 'uuid';

const createMessageReceivers = (serviceConnection: ServiceConnection) => {
    const callbacks = serviceConnection.getCallbackLists();
    return [
        new AnalyticsMessageReceiver(callbacks.analyticsRequestCallbacks),
        new ConfigStateMessageReceiver(callbacks.configStateCallbacks),
        // Passing wrapped callbacks so that the method is not copied and can be replaced in tests
        new HandPresenceMessageReceiver((state) => serviceConnection.handleHandPresenceEvent(state)),
        new InputActionMessageReceiver(),
        new InteractionZoneMessageReceiver((state) => serviceConnection.handleInteractionZoneEvent(state)),
        new ResponseMessageReceiver(callbacks.responseCallbacks),
        new ServiceStateMessageReceiver(callbacks.serviceStatusCallbacks),
        new TrackingStateMessageReceiver(callbacks.trackingStateCallbacks),
        new VersionHandshakeMessageReceiver(callbacks.handshakeCallbacks),
        new LicensingChangeResponseMessageReceiver(callbacks.licenseChangeCallbacks),
        new LicensingStateMessageReceiver(),
        new LicensingStateResponseMessageReceiver(callbacks.licenseStateCallbacks),
    ];
};

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

    private readonly handDataHandler: HandDataHandler;
    private readonly callbackLists: CallbackLists;
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

    /**
     * Get callback lists object
     */
    public getCallbackLists() {
        return this.callbackLists;
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
        this.callbackLists = createDefaultCallbackLists();
        this.handDataHandler = new HandDataHandler();
        this.messageReceivers = createMessageReceivers(this);
        setClearCallbacksInterval(300, 300, this.callbackLists);

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
                    this.callbackLists.handshakeCallbacks
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
        this.sendMessageWithSimpleResponse(message, requestID, callback, this.callbackLists.responseCallbacks);
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
            this.callbackLists.configStateCallbacks
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
            this.callbackLists.configStateCallbacks
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
            this.callbackLists.serviceStatusCallbacks
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
            this.callbackLists.configStateCallbacks
        );
    };

    /**
     * Use internally to request the current state of Licensing within the Service via the
     * {@link webSocket}. Provides a {@link LicenseState} through the _callback parameter.
     *
     * @param _callback - The callback through which the {@link LicenseState} will be provided upon
     * completion. If your _callback requires context it should be bound to that context via .bind()
     */
    requestLicenseState = (callback: (detail: LicenseStateResponse) => void): void => {
        this.baseRequestWithRequiredCallback(
            ActionCode.GET_LICENSE_STATE,
            'License state',
            callback,
            this.callbackLists.licenseStateCallbacks
        );
    };

    /**
     * Use internally to attempt to add a License Key to TouchFree
     *
     * @param licenseKey - the license key you wish to add
     * @param _callback - Provides a {@link LicenseChangeResponse} upon completion, which includes
     * a boolean success/fail state and string content.
     */
    addLicenseRequest = (licenseKey: string, callback: (detail: LicenseChangeResponse) => void): void => {
        this.baseRequest(
            { licenseKey: licenseKey },
            ActionCode.ADD_LICENSE_KEY,
            this.callbackLists.licenseChangeCallbacks,
            callback
        );
    };

    /**
     * Use internally to attempt to remove a License Key from TouchFree
     *
     * @param licenseKey - the license key you wish to remove
     * @param _callback - Provides a {@link LicenseChangeResponse} upon completion, which includes
     * a boolean success/fail state and string content.
     */
    removeLicenseRequest = (licenseKey: string, callback: (detail: LicenseChangeResponse) => void): void => {
        this.baseRequest(
            { licenseKey: licenseKey },
            ActionCode.ADD_LICENSE_KEY,
            this.callbackLists.licenseChangeCallbacks,
            callback
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
            this.callbackLists.responseCallbacks,
            callback,
            this.callbackLists.configStateCallbacks,
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
            this.callbackLists.trackingStateCallbacks
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
            this.callbackLists.trackingStateCallbacks,
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
            this.callbackLists.analyticsRequestCallbacks,
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
            this.callbackLists.analyticsRequestCallbacks,
            callback
        );

    /**
     * Handles HandPresence events from the service and dispatches
     * the `handFound` and `handsLost` events on this class
     * @param state - Hand state
     */
    handleHandPresenceEvent = (state: HandPresenceState): void => {
        this.currentHandPresence = state;

        if (state === HandPresenceState.HAND_FOUND) {
            dispatchEventCallback('handFound');
        } else {
            dispatchEventCallback('handsLost');
        }
    };

    /**
     * Handle an InteractionZone event by dispatching
     * `handEntered` and `handExited` events on this class
     */
    handleInteractionZoneEvent = (state: InteractionZoneState): void => {
        this.currentInteractionZoneState = state;

        if (state === InteractionZoneState.HAND_ENTERED) {
            dispatchEventCallback('handEntered');
        } else {
            dispatchEventCallback('handExited');
        }
    };
}

enum ServiceBinaryDataTypes {
    HAND_RENDER_DATA = 1,
}
