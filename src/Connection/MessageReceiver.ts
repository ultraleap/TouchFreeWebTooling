import { HandDataManager } from '../Plugins/HandDataManager';
import { InputActionManager } from '../Plugins/InputActionManager';
import { dispatchEvent } from '../TouchFree';
import { BitmaskFlags, convertInputAction, InputType, WebsocketInputAction } from '../TouchFreeToolingTypes';
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
    CallbackList,
} from './TouchFreeServiceTypes';

/**
 * Receives messages from the service and distributes them
 * to respective managers for handling.
 *
 * @internal
 */
export class MessageReceiver {
    /**
     * The amount of time between response callback handling to eliminate unhandled callbacks.
     * Prevents a performance death spiral scenario.
     */
    callbackClearTimer = 300;

    /**
     * How many times per second to process {@link WebSocketResponse} and {@link TouchFreeInputAction} requests.
     */
    updateRate = 60;

    /**
     * Duration (in seconds) of update interval - inverse of {@link updateRate}
     */
    private updateDuration: number;

    /**
     * How many non-essential {@link TouchFreeInputAction}s should the {@link actionQueue}
     * be trimmed *to* per frame. This is used to ensure the Tooling can keep up with the
     * Events sent over the WebSocket.
     */
    actionCullToCount = 2;

    /**
     * A queue of {@link TouchFreeInputAction}s that have been received from the Service.
     */
    actionQueue: Array<WebsocketInputAction> = [];

    /**
     * The latest `HandFrame` that has been received from the Service.
     */
    latestHandDataItem?: ArrayBuffer = undefined;

    /**
     * A queue of {@link WebSocketResponse}s that have been received from the Service.
     */
    responseQueue: Array<WebSocketResponse> = [];

    /**
     * A dictionary of unique request IDs and {@link ResponseCallback}s that represent requests
     * awaiting a response from the Service.
     */
    responseCallbacks: { [id: string]: ResponseCallback } = {};

    /**
     * A queue of {@link WebSocketResponse}s that have been received from the Service.
     */
    handshakeQueue: Array<WebSocketResponse> = [];

    /**
     * A dictionary of unique request IDs and {@link ResponseCallback}s that represent handshake
     * requests awaiting a response from the Service.
     */
    handshakeCallbacks: { [id: string]: ResponseCallback } = {};

    /**
     * A queue of {@link ConfigState} that have been received from the Service.
     */
    configStateQueue: Array<ConfigState> = [];

    /**
     * A dictionary of unique request IDs and {@link ConfigStateCallback} that represent requests
     * awaiting a response from the Service.
     */
    configStateCallbacks: { [id: string]: ConfigStateCallback } = {};

    /**
     * A queue of {@link ServiceStatus} that have been received from the Service.
     */
    serviceStatusQueue: Array<ServiceStatus> = [];

    /**
     * A dictionary of unique request IDs and {@link ServiceStatusCallback} that represent requests
     * awaiting a response from the Service.
     */
    serviceStatusCallbacks: { [id: string]: ServiceStatusCallback } = {};

    /**
     * The last hand presence state update received from the Service.
     */
    lastStateUpdate: HandPresenceState = HandPresenceState.PROCESSED;

    /**
     * The last interaction zone event update received from the Service.
     */
    lastInteractionZoneUpdate: EventUpdate<InteractionZoneState> = {
        state: InteractionZoneState.HAND_EXITED,
        status: 'PROCESSED',
    };

    /**
     * A queue of `TrackingStates` that have been received from the Service.
     */
    trackingStateQueue: Array<TrackingStateResponse> = [];

    /**
     * A dictionary of unique request IDs and {@link TrackingStateCallback} that represent requests
     * that are awaiting response from the Service.
     */
    trackingStateCallbacks: { [id: string]: TrackingStateCallback } = {};

    /** A queue of responses from service analytic calls */
    analyticsRequestQueue: WebSocketResponse[] = [];

    /**
     * A dictionary of unique request IDs and {@link WebSocketResponse} that represent requests
     * that are awaiting response from the Service.
     */
    analyticsRequestCallbacks: CallbackList<WebSocketResponse> = {};

    /**
     * Used to ensure UP events are sent at the correct position relative to the previous MOVE event.
     * This is required due to the culling of events from the {@link actionQueue} in {@link CheckForAction}.
     */
    lastKnownCursorPosition: Array<number> = [0, 0];

    /**
     * Starts the two regular intervals - {@link ClearUnresponsivePromises} (at {@link callbackClearTimer})
     * and {@link Update} (at {@link updateRate})
     */
    constructor() {
        this.updateDuration = (1 / this.updateRate) * 1000;

        setInterval(this.clearUnresponsivePromises as TimerHandler, this.callbackClearTimer);

        setInterval(this.update.bind(this) as TimerHandler, this.updateDuration);
    }

    /**
     * Checks all queues for messages to handle.
     */
    update(): void {
        this.checkForHandshakeResponse();
        this.checkForResponse();
        this.checkForConfigState();
        this.checkForServiceStatus();
        this.checkQueue(this.trackingStateQueue, this.trackingStateCallbacks);
        this.checkForAction();
        this.checkForHandData();
        this.checkQueue(this.analyticsRequestQueue, this.analyticsRequestCallbacks);
    }

    /**
     * Checks {@link handshakeQueue} for a single {@link WebSocketResponse} and handles it.
     */
    checkForHandshakeResponse(): void {
        const response = this.handshakeQueue.shift();

        if (response) {
            const responseResult = MessageReceiver.handleCallbackList(response, this.handshakeCallbacks);

            switch (responseResult) {
                case 'NoCallbacksFound':
                    this.logNoCallbacksWarning(response);
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

    private logNoCallbacksWarning(response: WebSocketResponse): void {
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

    /**
     * Used to check the {@link responseQueue} for a {@link WebSocketResponse}.
     * Sends it to {@link handleCallbackList} with the {@link responseCallbacks} dictionary if there is one.
     */
    checkForResponse(): void {
        const response = this.responseQueue.shift();

        if (response) {
            const responseResult = MessageReceiver.handleCallbackList(response, this.responseCallbacks);

            switch (responseResult) {
                case 'NoCallbacksFound':
                    this.logNoCallbacksWarning(response);
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

    /**
     * Checks {@link configStateQueue} for a single {@link configState} and handles it.
     */
    checkForConfigState(): void {
        const configState = this.configStateQueue.shift();

        if (configState) {
            const configResult = MessageReceiver.handleCallbackList(configState, this.configStateCallbacks);
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

    /**
     * Checks a callback dictionary for a request id and handles invoking the callback.
     *
     * @param callbackResult - Callback data
     * @param callbacks - Callback dictionary to check
     * @returns String literal result representing success or what went wrong
     */
    private static handleCallbackList<T extends WebSocketResponse | TouchFreeRequest>(
        callbackResult?: T,
        callbacks?: CallbackList<T>
    ): 'Success' | 'NoCallbacksFound' {
        if (!callbackResult || !callbacks) return 'NoCallbacksFound';
        for (const key in callbacks) {
            if (key === callbackResult.requestID) {
                callbacks[key].callback(callbackResult);
                delete callbacks[key];
                return 'Success';
            }
        }

        return 'NoCallbacksFound';
    }

    /**
     * Gets the next response in a given queue and handles the callback if present.
     * @param queue - The queue to get the response from
     * @param callbacks - The callback list to check against
     */
    private checkQueue<T extends WebSocketResponse | TrackingStateResponse>(
        queue: T[],
        callbacks: CallbackList<T>
    ): void {
        const response = queue.shift();

        if (!response || !callbacks) return;

        for (const key in callbacks) {
            if (key === response.requestID) {
                callbacks[key].callback(response);
                delete callbacks[key];
                return;
            }
        }
    }

    /**
     * Checks {@link serviceStatusQueue} for a single {@link ServiceStatus} and handles it.
     */
    checkForServiceStatus(): void {
        const serviceStatus = this.serviceStatusQueue.shift();

        if (serviceStatus) {
            const callbackResult = MessageReceiver.handleCallbackList(serviceStatus, this.serviceStatusCallbacks);

            switch (callbackResult) {
                // If callback didn't happen for known reasons, we can be sure it's an independent status event rather
                // than a request response
                // TODO: Send/handle this request from service differently from normal response so
                // we can be sure it's an independent event
                case 'NoCallbacksFound':
                    // If service state is null we didn't get info about it from this message
                    if (serviceStatus.trackingServiceState !== null) {
                        dispatchEvent('onTrackingServiceStateChange', serviceStatus.trackingServiceState);
                    }

                    dispatchEvent('onServiceStatusChange', serviceStatus);
                    break;
                case 'Success':
                    // no-op
                    break;
            }
        }
    }

    /**
     * Checks {@link trackingStateQueue} for a single {@link TrackingStateResponse} and handles it.
     *
     * @deprecated in favour of {@link CheckQueue}
     */
    checkForTrackingStateResponse(): void {
        const trackingStateResponse = this.trackingStateQueue.shift();

        if (trackingStateResponse) {
            this.handleTrackingStateResponse(trackingStateResponse);
        }
    }

    /**
     * Checks {@link trackingStateCallbacks} for a request id and handles invoking the callback.
     *
     * @deprecated in favour of {@link CheckQueue}
     */
    handleTrackingStateResponse(trackingStateResponse: TrackingStateResponse): void {
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

    /**
     * Checks {@link actionQueue} for a single {@link TouchFreeInputAction} and handles it.
     *
     * @remarks
     * If there are too many in the queue, clears out non-essential {@link TouchFreeInputAction}
     * down to the number specified by {@link actionCullToCount}.
     * If any remain, sends the oldest {@link TouchFreeInputAction} to {@link InputActionManager}
     * to handle the action. Actions with UP {@link InputType} have their positions set to
     * {@link lastKnownCursorPosition} to ensure input events trigger correctly.
     */
    checkForAction(): void {
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

        const action = this.actionQueue.shift();

        if (action !== undefined) {
            // Parse newly received messages & distribute them
            const converted = convertInputAction(action);

            // Cache or use the lastKnownCursorPosition. Copy the array to ensure it is not a reference
            if (converted.InputType !== InputType.UP) {
                this.lastKnownCursorPosition = Array.from(converted.CursorPosition);
            } else {
                converted.CursorPosition = Array.from(this.lastKnownCursorPosition);
            }

            // Wrapping the function in a timeout of 0 seconds allows the dispatch to be asynchronous
            setTimeout(() => {
                InputActionManager.handleInputAction(converted);
            });
        }

        if (this.lastStateUpdate !== HandPresenceState.PROCESSED) {
            ConnectionManager.handleHandPresenceEvent(this.lastStateUpdate);
            this.lastStateUpdate = HandPresenceState.PROCESSED;
        }

        if (this.lastInteractionZoneUpdate.status === 'UNPROCESSED') {
            ConnectionManager.handleInteractionZoneEvent(this.lastInteractionZoneUpdate.state);
            this.lastInteractionZoneUpdate.status = 'PROCESSED';
        }
    }

    /**
     * Checks {@link latestHandDataItem} and if the `HandFrame` is not undefined sends it to
     * {@link HandDataManager} to handle the frame.
     */
    checkForHandData(): void {
        const handFrame = this.latestHandDataItem;

        if (handFrame) {
            this.latestHandDataItem = undefined;
            // Wrapping the function in a timeout of 0 seconds allows the dispatch to be asynchronous
            setTimeout(() => {
                HandDataManager.handleHandFrame(handFrame);
            });
        }
    }

    /**
     * Clear {@link responseCallbacks} that have been around for more than {@link callbackClearTimer}.
     */
    clearUnresponsivePromises(): void {
        const lastClearTime: number = Date.now();

        MessageReceiver.clearUnresponsiveItems(lastClearTime, this.responseCallbacks);
        MessageReceiver.clearUnresponsiveItems(lastClearTime, this.handshakeCallbacks);
        MessageReceiver.clearUnresponsiveItems(lastClearTime, this.configStateCallbacks);
        MessageReceiver.clearUnresponsiveItems(lastClearTime, this.serviceStatusCallbacks);
        MessageReceiver.clearUnresponsiveItems(lastClearTime, this.trackingStateCallbacks);
    }

    private static clearUnresponsiveItems<T>(
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
