import { HandDataManager } from '../Plugins/HandDataManager';
import { InputActionManager } from '../Plugins/InputActionManager';
import TouchFree from '../TouchFree';
import {
    BitmaskFlags,
    ConvertInputAction,
    InputType,
    TouchFreeInputAction,
    WebsocketInputAction,
} from '../TouchFreeToolingTypes';
import { ConnectionManager } from './ConnectionManager';
import {
    ConfigState,
    ConfigStateCallback,
    HandPresenceState,
    TouchFreeRequestCallback,
    ResponseCallback,
    ServiceStatus,
    ServiceStatusCallback,
    TouchFreeRequest,
    TrackingStateCallback,
    TrackingStateResponse,
    WebSocketResponse,
    InteractionZoneState,
    EventUpdate,
    LicenseStateCallback,
    LicenseChangeCallback,
    LicenseStateResponse,
    LicenseChangeResponse,
} from './TouchFreeServiceTypes';

// Class: MessageReceiver
// Handles the receiving of messages from the Service in an ordered manner.
// Distributes the results of the messages to the respective managers.
export class MessageReceiver {
    // Group: Variables

    // Variable: callbackClearTimer
    // The amount of time between checks of <responseCallbacks> to eliminate expired
    // <ResponseCallbacks>. Used in <ClearUnresponsiveCallbacks>.
    callbackClearTimer = 300;

    // Variable: update Rate
    // How many times per second to process <WebSocketResponse> & <TouchFreeInputActions>
    updateRate = 60;

    // Calculated on construction for use in setting the update interval
    private updateDuration: number;

    // Variable: actionCullToCount
    // How many non-essential <TouchFreeInputActions> should the <actionQueue> be trimmed *to* per
    // frame. This is used to ensure the Tooling can keep up with the Events sent over the
    // WebSocket.
    actionCullToCount = 2;

    // Variable: actionQueue
    // A queue of <TouchFreeInputActions> that have been received from the Service.
    actionQueue: Array<WebsocketInputAction> = [];

    // Variable: latestHandDataItem
    // The latest <HandFrame> that has been received from the Service.
    latestHandDataItem?: ArrayBuffer = undefined;

    // Variable: responseQueue
    // A queue of <WebSocketResponses> that have been received from the Service.
    responseQueue: Array<WebSocketResponse> = [];

    // Variable: responseCallbacks
    // A dictionary of unique request IDs and <ResponseCallbacks> that represent requests
    // that are awaiting response from the Service.
    responseCallbacks: { [id: string]: ResponseCallback } = {};

    // Variable: handshakeQueue
    // A queue of handshake <WebSocketResponses> that have been received from the Service.
    handshakeQueue: Array<WebSocketResponse> = [];

    // Variable: handshakeCallbacks
    // A dictionary of unique request IDs and <ResponseCallbacks> that represent handshake requests
    // that are awaiting response from the Service.
    handshakeCallbacks: { [id: string]: ResponseCallback } = {};

    // Variable: configStateQueue
    // A queue of <ConfigState> that have been received from the Service.
    configStateQueue: Array<ConfigState> = [];

    // Variable: configStateCallbacks
    // A dictionary of unique request IDs and <ConfigStateCallback> that represent requests
    // that are awaiting response from the Service.
    configStateCallbacks: { [id: string]: ConfigStateCallback } = {};

    // Variable: serviceStatusQueue
    // A queue of <ServiceStatus> that have been received from the Service.
    serviceStatusQueue: Array<ServiceStatus> = [];

    // Variable: serviceStatusCallbacks
    // A dictionary of unique request IDs and <ServiceStatusCallback> that represent requests
    // that are awaiting response from the Service.
    serviceStatusCallbacks: { [id: string]: ServiceStatusCallback } = {};

    licenseStateCallbacks: { [id: string]: LicenseStateCallback } = {};
    licenseStateQueue: Array<LicenseStateResponse> = [];

    licenseChangeCallbacks: { [id: string]: LicenseChangeCallback } = {};
    licenseChangeResponseQueue: Array<LicenseChangeResponse> = [];

    // Variable: lastStateUpdate
    // The last hand presence state update received from the Service.
    lastStateUpdate: HandPresenceState = HandPresenceState.PROCESSED;

    // Variable: lastInteractionZoneUpdate
    // The last interaction zone event update received from the Service.
    lastInteractionZoneUpdate: EventUpdate<InteractionZoneState> = {
        state: InteractionZoneState.HAND_EXITED,
        status: 'PROCESSED',
    };

    // Variable: trackingStateQueue
    // A queue of <TrackingStates> that have been received from the Service.
    trackingStateQueue: Array<TrackingStateResponse> = [];

    // Variable: trackingSettingsStateCallbacks
    // A dictionary of unique request IDs and <TrackingStateCallback> that represent requests
    // that are awaiting response from the Service.
    trackingStateCallbacks: { [id: string]: TrackingStateCallback } = {};

    // Variable: callbackClearInterval
    // Stores the reference number for the interval running <ClearUnresponsiveCallbacks>, allowing
    // it to be cleared.
    private callbackClearInterval: number;

    // Variable: updateInterval
    // Stores the reference number for the interval running <Update>, allowing it to be cleared.
    private updateInterval: number;

    // Used to ensure UP events are sent at the correct position relative to the previous
    // MOVE event.
    // This is required due to the culling of events from the actionQueue in CheckForAction.
    lastKnownCursorPosition: Array<number> = [0, 0];

    // Group: Functions

    // Function: constructor
    // Starts the two regular intervals managed for this (running <ClearUnresponsiveCallbacks> on an
    // interval of <callbackClearTimer> and <Update> on an interval of updateDuration
    constructor() {
        this.updateDuration = (1 / this.updateRate) * 1000;

        this.callbackClearInterval = setInterval(
            this.ClearUnresponsivePromises as TimerHandler,
            this.callbackClearTimer
        );

        this.updateInterval = setInterval(this.Update.bind(this) as TimerHandler, this.updateDuration);
    }

    // Function: Update
    // Update function. Checks all queues for messages to handle. Run on an interval
    // started during the constructor
    Update(): void {
        this.CheckForHandshakeResponse();
        this.CheckForResponse();
        this.CheckForConfigState();
        this.CheckForServiceStatus();
        this.CheckForTrackingStateResponse();
        this.CheckForAction();
        this.CheckForHandData();
        this.CheckForLicenseData();
    }

    // Function: CheckForHandshakeResponse
    // Used to check the <responseQueue> for a <WebSocketResponse>. Sends it to Sends it to <HandleCallbackList> with
    // the <responseCallbacks> dictionary if there is one.
    CheckForHandshakeResponse(): void {
        const response: WebSocketResponse | undefined = this.handshakeQueue.shift();

        if (response) {
            const responseResult = MessageReceiver.HandleCallbackList(response, this.handshakeCallbacks);

            switch (responseResult) {
                case 'NoCallbacksFound':
                    this.LogNoCallbacksWarning(response);
                    break;
                case 'Success':
                    if (response.message && response.status === 'Success') {
                        if (response.message.indexOf('Handshake Warning') >= 0) {
                            console.warn('Received Handshake Warning from TouchFree:\n' + response.message);
                        } else {
                            console.log('Received Handshake Success from TouchFree:\n' + response.message);
                        }
                    } else {
                        console.error('Received Handshake Error from TouchFree:\n' + response.message);
                    }
                    break;
            }
        }
    }

    private LogNoCallbacksWarning(response: WebSocketResponse): void {
        console.warn(
            'Received a Handshake Response that did not match a callback.' +
                'This is the content of the response: \n Response ID: ' +
                response.requestID +
                '\n Status: ' +
                response.status +
                '\n Message: ' +
                response.message +
                '\n Original request - ' +
                response.originalRequest
        );
    }

    // Function: CheckForResponse
    // Used to check the <responseQueue> for a <WebSocketResponse>. Sends it to Sends it to <HandleCallbackList> with
    // the <responseCallbacks> dictionary if there is one.
    CheckForResponse(): void {
        const response: WebSocketResponse | undefined = this.responseQueue.shift();

        if (response) {
            const responseResult = MessageReceiver.HandleCallbackList(response, this.responseCallbacks);

            switch (responseResult) {
                case 'NoCallbacksFound':
                    this.LogNoCallbacksWarning(response);
                    break;
                case 'Success':
                    if (response.message) {
                        // This is logged to aid users in debugging
                        console.log('Successfully received WebSocketResponse from TouchFree:\n' + response.message);
                    }
                    break;
            }
        }
    }

    // Function: CheckForConfigState
    // Used to check the <configStateQueue> for a <ConfigState>. Sends it to <HandleCallbackList> with
    // the <configStateCallbacks> dictionary if there is one.
    CheckForConfigState(): void {
        const configState: ConfigState | undefined = this.configStateQueue.shift();

        if (configState) {
            const configResult = MessageReceiver.HandleCallbackList(configState, this.configStateCallbacks);
            switch (configResult) {
                case 'NoCallbacksFound':
                    console.warn('Received a ConfigState message that did not match a callback.');
                    break;
                case 'Success':
                    // no-op
                    break;
            }
        }
    }

    // Function: HandleCallbackList
    // Checks the dictionary of <callbacks> for a matching request ID. If there is a
    // match, calls the callback action in the matching <TouchFreeRequestCallback>.
    // Returns true if it was able to find a callback, returns false if not
    private static HandleCallbackList<T extends TouchFreeRequest>(
        callbackResult: T,
        callbacks: { [id: string]: TouchFreeRequestCallback<T> }
    ): 'Success' | 'NoCallbacksFound' {
        for (const key in callbacks) {
            if (key === callbackResult.requestID) {
                callbacks[key].callback(callbackResult);
                delete callbacks[key];
                return 'Success';
            }
        }

        return 'NoCallbacksFound';
    }

    // Function: CheckForServiceStatus
    // Used to check the <serviceStatusQueue> for a <ServiceStatus>. Sends it to <HandleCallbackList> with
    // the <serviceStatusCallbacks> dictionary if there is one.
    CheckForServiceStatus(): void {
        const serviceStatus: ServiceStatus | undefined = this.serviceStatusQueue.shift();

        if (serviceStatus) {
            const callbackResult = MessageReceiver.HandleCallbackList(serviceStatus, this.serviceStatusCallbacks);

            switch (callbackResult) {
                // If callback didn't happen for known reasons, we can be sure it's an independent status event rather
                // than a request response
                // TODO: Send/handle this request from service differently from normal response so
                // we can be sure it's an independent event
                case 'NoCallbacksFound':
                    // If service state is null we didn't get info about it from this message
                    if (serviceStatus.trackingServiceState !== null) {
                        TouchFree.DispatchEvent('OnTrackingServiceStateChange', serviceStatus.trackingServiceState);
                    }

                    TouchFree.DispatchEvent('OnServiceStatusChange', serviceStatus);
                    break;
                case 'Success':
                    // no-op
                    break;
            }
        }
    }

    // Function: CheckForTrackingStateResponse
    // Used to check the <trackingStateQueue> for a <TrackingStateResponse>.
    // Sends it to <HandleTrackingStateResponse> if there is one.
    CheckForTrackingStateResponse(): void {
        const trackingStateResponse: TrackingStateResponse | undefined = this.trackingStateQueue.shift();

        if (trackingStateResponse) {
            this.HandleTrackingStateResponse(trackingStateResponse);
        }
    }

    // Function: HandleTrackingStateResponse
    // Checks the dictionary of <trackingStateCallbacks> for a matching request ID. If there is a
    // match, calls the callback action in the matching <TrackingStateCallback>.
    HandleTrackingStateResponse(trackingStateResponse: TrackingStateResponse): void {
        if (this.trackingStateCallbacks !== undefined) {
            for (const key in this.trackingStateCallbacks) {
                if (key === trackingStateResponse.requestID) {
                    this.trackingStateCallbacks[key].callback(trackingStateResponse);
                    delete this.trackingStateCallbacks[key];
                    return;
                }
            }
        }
    }

    // Function: CheckForAction
    // Checks <actionQueue> for valid <TouchFreeInputActions>. If there are too many in the queue,
    // clears out non-essential <TouchFreeInputActions> down to the number specified by
    // <actionCullToCount>. If any remain, sends the oldest <TouchFreeInputAction> to
    // <InputActionManager> to handle the action.
    // UP <InputType>s have their positions set to the last known position to ensure
    // input events trigger correctly.
    CheckForAction(): void {
        while (this.actionQueue.length > this.actionCullToCount) {
            if (this.actionQueue[0] !== undefined) {
                // Stop shrinking the queue if we have a 'key' input event
                if (
                    this.actionQueue[0].InteractionFlags & BitmaskFlags.MOVE ||
                    this.actionQueue[0].InteractionFlags & BitmaskFlags.NONE_INPUT
                ) {
                    // We want to ignore non-move results
                    this.actionQueue.shift();
                } else {
                    break;
                }
            }
        }

        const action: WebsocketInputAction | undefined = this.actionQueue.shift();

        if (action !== undefined) {
            // Parse newly received messages & distribute them
            const converted: TouchFreeInputAction = ConvertInputAction(action);

            //Cache or use the lastKnownCursorPosition. Copy the array to ensure it is not a reference
            if (converted.InputType !== InputType.UP) {
                this.lastKnownCursorPosition = Array.from(converted.CursorPosition);
            } else {
                converted.CursorPosition = Array.from(this.lastKnownCursorPosition);
            }

            // Wrapping the function in a timeout of 0 seconds allows the dispatch to be asynchronous
            setTimeout(() => {
                InputActionManager.HandleInputAction(converted);
            });
        }

        if (this.lastStateUpdate !== HandPresenceState.PROCESSED) {
            ConnectionManager.HandleHandPresenceEvent(this.lastStateUpdate);
            this.lastStateUpdate = HandPresenceState.PROCESSED;
        }

        if (this.lastInteractionZoneUpdate.status === 'UNPROCESSED') {
            ConnectionManager.HandleInteractionZoneEvent(this.lastInteractionZoneUpdate.state);
            this.lastInteractionZoneUpdate.status = 'PROCESSED';
        }
    }

    CheckForLicenseData(): void {
        const licenseStateResponse: LicenseStateResponse | undefined = this.licenseStateQueue.shift();

        if (licenseStateResponse) {
            this.HandleResponseInQueue(licenseStateResponse, this.licenseStateCallbacks);
        }

        const licenseChangeResponse: LicenseChangeResponse | undefined = this.licenseChangeResponseQueue.shift();

        if (licenseChangeResponse) {
            this.HandleResponseInQueue(licenseChangeResponse, this.licenseChangeCallbacks);
        }
    }

    private HandleResponseInQueue<
        ResponseType extends TouchFreeRequest,
        CallbackType extends TouchFreeRequestCallback<ResponseType>>
        (response: ResponseType, callbackList: { [id: string]: CallbackType }) {
        if (callbackList !== undefined) {
            for (const key in callbackList) {
                if (key === response.requestID) {
                    callbackList[key].callback(response);
                }
            }
        }
    }

    // Function: CheckForHandData
    // Checks <latestHandDataItem> and if the <HandFrame> is not undefined sends it to
    // <HandDataManager> to handle the frame.
    CheckForHandData(): void {
        const handFrame = this.latestHandDataItem;

        if (handFrame) {
            this.latestHandDataItem = undefined;
            // Wrapping the function in a timeout of 0 seconds allows the dispatch to be asynchronous
            setTimeout(() => {
                HandDataManager.HandleHandFrame(handFrame);
            });
        }
    }

    // Function: ClearUnresponsiveCallbacks
    // Waits for <callbackClearTimer> seconds and clears all <ResponseCallbacks> that are
    // expired from <responseCallbacks>.
    ClearUnresponsivePromises(): void {
        const lastClearTime: number = Date.now();

        MessageReceiver.ClearUnresponsiveItems(lastClearTime, this.responseCallbacks);
        MessageReceiver.ClearUnresponsiveItems(lastClearTime, this.handshakeCallbacks);
        MessageReceiver.ClearUnresponsiveItems(lastClearTime, this.configStateCallbacks);
        MessageReceiver.ClearUnresponsiveItems(lastClearTime, this.serviceStatusCallbacks);
        MessageReceiver.ClearUnresponsiveItems(lastClearTime, this.trackingStateCallbacks);
    }

    private static ClearUnresponsiveItems<T>(
        lastClearTime: number,
        callbacks: { [id: string]: TouchFreeRequestCallback<T> }
    ) {
        if (callbacks !== undefined) {
            for (const key in callbacks) {
                if (callbacks[key].timestamp < lastClearTime) {
                    delete callbacks[key];
                } else {
                    break;
                }
            }
        }
    }
}
