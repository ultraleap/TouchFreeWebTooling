import {
    type ConfigState,
    type LicenseChangeResponse,
    type LicenseStateResponse,
    type ServiceStateResponse,
    type TouchFreeRequestCallback,
    type TrackingStateResponse,
    type WebSocketResponse,
} from './RequestTypes';

/**
 * Represents a list of callbacks keyed against id strings
 * @internal
 */
export type CallbackList<T> = { [id: string]: TouchFreeRequestCallback<T> };

/**
 * Callback list with extra info
 * @internal
 */
export interface CallbackInfo<T> {
    timeoutMs: number;
    callbacks: CallbackList<T>;
}

/**
 * All the callback lists required for message receivers
 * @internal
 */
export interface CallbackLists {
    analyticsRequestCallbacks: CallbackInfo<WebSocketResponse>;
    configStateCallbacks: CallbackInfo<ConfigState>;
    responseCallbacks: CallbackInfo<WebSocketResponse>;
    serviceStatusCallbacks: CallbackInfo<ServiceStateResponse>;
    trackingStateCallbacks: CallbackInfo<TrackingStateResponse>;
    handshakeCallbacks: CallbackInfo<WebSocketResponse>;
    licenseStateCallbacks: CallbackInfo<LicenseStateResponse>;
    licenseChangeCallbacks: CallbackInfo<LicenseChangeResponse>;
}

export const createDefaultCallbackLists = (): CallbackLists => ({
    analyticsRequestCallbacks: { timeoutMs: 500, callbacks: {} },
    configStateCallbacks: { timeoutMs: 500, callbacks: {} },
    handshakeCallbacks: { timeoutMs: 500, callbacks: {} },
    responseCallbacks: { timeoutMs: 500, callbacks: {} },
    serviceStatusCallbacks: { timeoutMs: 500, callbacks: {} },
    trackingStateCallbacks: { timeoutMs: 500, callbacks: {} },
    licenseStateCallbacks: { timeoutMs: 500, callbacks: {} },
    licenseChangeCallbacks: { timeoutMs: 30000, callbacks: {} },
});

export const setClearCallbacksInterval = (intervalDurationMs: number, callbackLists: CallbackLists) => {
    const clearExpiredCallbacks = () => {
        const currentTime: number = Date.now();

        Object.values(callbackLists).forEach((callbackInfo) => {
            if (callbackInfo === undefined) return;
            const callbacks = callbackInfo.callbacks;
            for (const key in callbacks) {
                if (currentTime - callbacks[key].timestamp > callbackInfo.timeoutMs) {
                    delete callbacks[key];
                } else {
                    break;
                }
            }
        });
    };

    setInterval(clearExpiredCallbacks, intervalDurationMs);
};
