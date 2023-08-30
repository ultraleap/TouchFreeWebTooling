import {
    ConfigState,
    ServiceStatus,
    TouchFreeRequestCallback,
    TrackingStateResponse,
    WebSocketResponse,
} from './RequestTypes';

/**
 * Represents a list of callbacks keyed against id strings
 * @internal
 */
export type CallbackList<T> = { [id: string]: TouchFreeRequestCallback<T> };

/**
 * Holds all of the callbacks that are pending response from the service.
 *
 * @internal
 */
export class CallbackHandler {
    /**
     * Starts a regular interval to {@link clearUnresponsivePromises} every {@link callbackClearTimer}
     */
    constructor() {
        setInterval(this.clearUnresponsivePromises, this.callbackClearTimer);
    }

    /**
     * The amount of time between response callback handling to eliminate unhandled callbacks.
     * Prevents a performance death spiral scenario.
     */
    callbackClearTimer = 300;

    /**
     * A {@link CallbackList} awaiting {@link WebSocketResponse} responses from the Service.
     */
    analyticsRequestCallbacks: CallbackList<WebSocketResponse> = {};

    /**
     * A {@link CallbackList} awaiting {@link ConfigState} responses from the Service.
     */
    configStateCallbacks: CallbackList<ConfigState> = {};

    /**
     * A {@link CallbackList} awaiting {@link WebSocketResponse} responses from the Service.
     */
    responseCallbacks: CallbackList<WebSocketResponse> = {};

    /**
     * A {@link CallbackList} awaiting {@link ServiceStatus} responses from the Service.
     */
    serviceStatusCallbacks: CallbackList<ServiceStatus> = {};

    /**
     * A {@link CallbackList} awaiting {@link TrackingStateResponse} responses from the Service.
     */
    trackingStateCallbacks: CallbackList<TrackingStateResponse> = {};

    /**
     * A {@link CallbackList} awaiting {@link WebSocketResponse} responses from the Service.
     */
    handshakeCallbacks: CallbackList<WebSocketResponse> = {};

    /**
     * Clear {@link responseCallbacks} that have been around for more than {@link callbackClearTimer}.
     */
    clearUnresponsivePromises(): void {
        const lastClearTime: number = Date.now();

        CallbackHandler.clearUnresponsiveItems(lastClearTime, this.analyticsRequestCallbacks);
        CallbackHandler.clearUnresponsiveItems(lastClearTime, this.configStateCallbacks);
        CallbackHandler.clearUnresponsiveItems(lastClearTime, this.responseCallbacks);
        CallbackHandler.clearUnresponsiveItems(lastClearTime, this.serviceStatusCallbacks);
        CallbackHandler.clearUnresponsiveItems(lastClearTime, this.trackingStateCallbacks);
        CallbackHandler.clearUnresponsiveItems(lastClearTime, this.handshakeCallbacks);
    }

    private static clearUnresponsiveItems<T>(lastClearTime: number, callbacks: CallbackList<T>) {
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
