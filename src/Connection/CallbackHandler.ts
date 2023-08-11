import {
    CallbackList,
    ConfigState,
    ServiceStatus,
    TrackingStateResponse,
    WebSocketResponse,
} from './TouchFreeServiceTypes';

/**
 * Holds all of the callbacks that are pending response from the service.
 *
 * @internal
 */
export class CallbackHandler {
    /**
     * Starts a regular interval - {@link ClearUnresponsivePromises} (at {@link callbackClearTimer})
     */
    constructor() {
        setInterval(this.ClearUnresponsivePromises, this.callbackClearTimer);
    }

    /**
     * The amount of time between response callback handling to eliminate unhandled callbacks.
     * Prevents a performance death spiral scenario.
     */
    callbackClearTimer = 300;

    /**
     * A {@link CallbackList} awaiting {@link WebSocketResponse} reponses from the Service.
     */
    analyticsRequestCallbacks: CallbackList<WebSocketResponse> = {};

    /**
     * A {@link CallbackList} awaiting {@link ConfigState} reponses from the Service.
     */
    configStateCallbacks: CallbackList<ConfigState> = {};

    /**
     * A {@link CallbackList} awaiting {@link WebSocketResponse} reponses from the Service.
     */
    responseCallbacks: CallbackList<WebSocketResponse> = {};

    /**
     * A {@link CallbackList} awaiting {@link ServiceStatus} reponses from the Service.
     */
    serviceStatusCallbacks: CallbackList<ServiceStatus> = {};

    /**
     * A {@link CallbackList} awaiting {@link TrackingStateResponse} reponses from the Service.
     */
    trackingStateCallbacks: CallbackList<TrackingStateResponse> = {};

    /**
     * A {@link CallbackList} awaiting {@link WebSocketResponse} reponses from the Service.
     */
    handshakeCallbacks: CallbackList<WebSocketResponse> = {};

    /**
     * Clear {@link responseCallbacks} that have been around for more than {@link callbackClearTimer}.
     */
    ClearUnresponsivePromises(): void {
        const lastClearTime: number = Date.now();

        CallbackHandler.ClearUnresponsiveItems(lastClearTime, this.analyticsRequestCallbacks);
        CallbackHandler.ClearUnresponsiveItems(lastClearTime, this.configStateCallbacks);
        CallbackHandler.ClearUnresponsiveItems(lastClearTime, this.responseCallbacks);
        CallbackHandler.ClearUnresponsiveItems(lastClearTime, this.serviceStatusCallbacks);
        CallbackHandler.ClearUnresponsiveItems(lastClearTime, this.trackingStateCallbacks);
        CallbackHandler.ClearUnresponsiveItems(lastClearTime, this.handshakeCallbacks);
    }

    private static ClearUnresponsiveItems<T>(lastClearTime: number, callbacks: CallbackList<T>) {
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
