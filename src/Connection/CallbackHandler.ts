import {
    CallbackList,
    ConfigState,
    ServiceStatus,
    TrackingStateResponse,
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
    configStateCallbacks: CallbackList<ConfigState> = {};

    // Variable: responseCallbacks
    // A dictionary of unique request IDs and <ResponseCallbacks> that represent requests
    // that are awaiting response from the Service.
    responseCallbacks: CallbackList<WebSocketResponse> = {};

    // Variable: serviceStatusCallbacks
    // A dictionary of unique request IDs and <ServiceStatusCallback> that represent requests
    // that are awaiting response from the Service.
    serviceStatusCallbacks: CallbackList<ServiceStatus> = {};

    // Variable: trackingSettingsStateCallbacks
    // A dictionary of unique request IDs and <TrackingStateCallback> that represent requests
    // that are awaiting response from the Service.
    trackingStateCallbacks: CallbackList<TrackingStateResponse> = {};

    // Variable: handshakeCallbacks
    // A dictionary of unique request IDs and <ResponseCallbacks> that represent handshake requests
    // that are awaiting response from the Service.
    handshakeCallbacks: CallbackList<WebSocketResponse> = {};

    // Function: ClearUnresponsiveCallbacks
    // Waits for <callbackClearTimer> seconds and clears all <ResponseCallbacks> that are
    // expired from <responseCallbacks>.
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
