import {
    ConfigState,
    ServiceStateResponse,
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
 * All the callback lists required for message receivers
 * @internal
 */
export interface CallbackLists {
    analyticsRequestCallbacks: CallbackList<WebSocketResponse>;
    configStateCallbacks: CallbackList<ConfigState>;
    responseCallbacks: CallbackList<WebSocketResponse>;
    serviceStatusCallbacks: CallbackList<ServiceStateResponse>;
    trackingStateCallbacks: CallbackList<TrackingStateResponse>;
    handshakeCallbacks: CallbackList<WebSocketResponse>;
}

export const createDefaultCallbackLists = (): CallbackLists => ({
    analyticsRequestCallbacks: {},
    configStateCallbacks: {},
    handshakeCallbacks: {},
    responseCallbacks: {},
    serviceStatusCallbacks: {},
    trackingStateCallbacks: {},
});

export const setClearCallbacksInterval = (
    timeoutMs: number,
    intervalDurationMs: number,
    callbackLists: CallbackLists
) => {
    const clearExpiredCallbacks = () => {
        const currentTime: number = Date.now();

        Object.values(callbackLists).forEach((callbacks) => {
            if (callbacks === undefined) return;
            for (const key in callbacks) {
                if (currentTime - callbacks[key].timestamp > timeoutMs) {
                    delete callbacks[key];
                } else {
                    break;
                }
            }
        });
    };

    setInterval(clearExpiredCallbacks, intervalDurationMs);
};
