import { WebSocketResponse } from '../Connection/RequestTypes';

/**
 * @internal
 */
export type WebSocketCallback = (detail: WebSocketResponse) => void;

/**
 * Index object of {@link AnalyticEventKey} to number
 * @public
 */
export type AnalyticSessionEvents = { [key in AnalyticEventKey]?: number };

/**
 * Supported analytic event types
 * @public
 */
export type AnalyticEventKey = keyof DocumentEventMap;

/**
 * Type of analytics session request
 * @internal
 */
export type AnalyticsSessionRequestType = 'START' | 'STOP';

/**
 * Options to use with {@link startAnalyticsSession}
 *
 * @public
 */
export interface StartAnalyticsSessionOptions {
    callback?: WebSocketCallback;
    stopCurrentSession?: boolean;
}

/**
 * Options to use with {@link stopAnalyticsSession}
 *
 * @public
 */
export interface StopAnalyticsSessionOptions {
    callback?: WebSocketCallback;
}
