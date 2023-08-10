import {
    CallbackList,
    ConfigStateCallback,
    ResponseCallback,
    ServiceStatusCallback,
    TouchFreeRequestCallback,
    TrackingStateCallback,
    WebSocketResponse,
} from './TouchFreeServiceTypes';

export class CallbackHandler {
    constructor() {
        setInterval(this.ClearUnresponsivePromises, this.callbackClearTimer);
    }

    // Variable: callbackClearTimer
    // The amount of time between checks of <responseCallbacks> to eliminate expired
    // <ResponseCallbacks>. Used in <ClearUnresponsiveCallbacks>.
    callbackClearTimer = 300;

    // Variable: analyticsRequestCallbacks
    // A dictionary of unique request IDs and <ResponseCallback> that represent requests
    // that are awaiting response from the Service.
    analyticsRequestCallbacks: CallbackList<WebSocketResponse> = {};

    // Variable: configStateCallbacks
    // A dictionary of unique request IDs and <ConfigStateCallback> that represent requests
    // that are awaiting response from the Service.
    configStateCallbacks: { [id: string]: ConfigStateCallback } = {};

    // Variable: responseCallbacks
    // A dictionary of unique request IDs and <ResponseCallbacks> that represent requests
    // that are awaiting response from the Service.
    responseCallbacks: { [id: string]: ResponseCallback } = {};

    // Variable: serviceStatusCallbacks
    // A dictionary of unique request IDs and <ServiceStatusCallback> that represent requests
    // that are awaiting response from the Service.
    serviceStatusCallbacks: { [id: string]: ServiceStatusCallback } = {};

    // Variable: trackingSettingsStateCallbacks
    // A dictionary of unique request IDs and <TrackingStateCallback> that represent requests
    // that are awaiting response from the Service.
    trackingStateCallbacks: { [id: string]: TrackingStateCallback } = {};

    // Variable: handshakeCallbacks
    // A dictionary of unique request IDs and <ResponseCallbacks> that represent handshake requests
    // that are awaiting response from the Service.
    handshakeCallbacks: { [id: string]: ResponseCallback } = {};

    // Function: ClearUnresponsiveCallbacks
    // Waits for <callbackClearTimer> seconds and clears all <ResponseCallbacks> that are
    // expired from <responseCallbacks>.
    ClearUnresponsivePromises(): void {
        const lastClearTime: number = Date.now();

        CallbackHandler.ClearUnresponsiveItems(lastClearTime, this.responseCallbacks);
        CallbackHandler.ClearUnresponsiveItems(lastClearTime, this.handshakeCallbacks);
        CallbackHandler.ClearUnresponsiveItems(lastClearTime, this.configStateCallbacks);
        CallbackHandler.ClearUnresponsiveItems(lastClearTime, this.serviceStatusCallbacks);
        CallbackHandler.ClearUnresponsiveItems(lastClearTime, this.trackingStateCallbacks);
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
