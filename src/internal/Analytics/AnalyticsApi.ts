import { getServiceConnection } from '../Connection/ConnectionApi';
import { ResponseCallback } from '../Connection/ConnectionTypes';
import {
    AnalyticSessionEvents,
    AnalyticEventKey,
    AnalyticsSessionRequestType,
    StartAnalyticsSessionOptions,
    StopAnalyticsSessionOptions,
} from './AnalyticsTypes';
import { v4 as uuidgen } from 'uuid';

let currentSessionId: string | undefined;
let analyticsHeartbeat: number;
let sessionEvents: AnalyticSessionEvents = {};

const analyticEvents: { [key in AnalyticEventKey]?: (e: Event) => void } = {};
const defaultAnalyticEvents: readonly AnalyticEventKey[] = ['touchstart', 'touchmove', 'touchend'];

const isTFPointerEvent = (e: Event): boolean => 'pointerType' in e && e.pointerType === 'pen' && !e.isTrusted;

/**
 * @returns `true` if there is an active analytics session, `false` otherwise
 * @public
 */
export const isAnalyticsActive = () => currentSessionId !== undefined;

/**
 * Returns a copy of an indexed object detailing how many times each analytics event has been triggered
 * @public
 */
export const getAnalyticSessionEvents = (): AnalyticSessionEvents => Object.assign({}, sessionEvents);

/**
 * Returns the list of registered analytic event keys
 * @public
 */
export const getRegisteredAnalyticEventKeys = () => Object.keys(analyticEvents);

/**
 * Registers a given list of event for the TouchFree service to record.
 * @param eventsIn - Events to register. If none are provided then default set of events will be recorded.
 *
 * @public
 */
export function registerAnalyticEvents(eventsIn: readonly AnalyticEventKey[] = defaultAnalyticEvents) {
    eventsIn.forEach((evt) => {
        if (analyticEvents[evt]) return;
        const onEvent = (e: Event) => {
            if (isTFPointerEvent(e)) return;
            const eventCount = sessionEvents[evt];
            sessionEvents[evt] = eventCount === undefined ? 1 : eventCount + 1;
        };
        analyticEvents[evt] = onEvent;
        document.addEventListener(evt, onEvent, true);
    });
}

/**
 * Unregisters a given list of event for the TouchFree service to record.
 * @param eventsIn - Events to unregister. If none are provided then all events will be unregistered.
 *
 * @public
 */
export function unregisterAnalyticEvents(eventsIn?: AnalyticEventKey[]) {
    const events: AnalyticEventKey[] = eventsIn ?? (Object.keys(analyticEvents) as AnalyticEventKey[]);

    events.forEach((evt) => {
        const evtFunc = analyticEvents[evt];
        if (evtFunc) {
            document.removeEventListener(evt, evtFunc, true);
            delete analyticEvents[evt];
        }
    });
}

/**
 * Used to start or stop an analytics session
 *
 * @param requestType - START or STOP session. See {@link AnalyticsSessionRequestType}
 * @param application - Name of application
 * @param callback - Optional callback to handle Service's response
 */
function controlAnalyticsSession(
    requestType: AnalyticsSessionRequestType,
    application: string,
    callback?: ResponseCallback
) {
    const serviceConnection = getServiceConnection();
    if (!serviceConnection) return;

    if (requestType === 'START') {
        if (currentSessionId) {
            console.warn(`Session: ${currentSessionId} already in progress`);
            return;
        }
        const newID = `${application}:${uuidgen()}`;

        serviceConnection.analyticsSessionRequest(requestType, newID, (detail) => {
            if (detail.status !== 'Failure') {
                currentSessionId = newID;
                analyticsHeartbeat = window.setInterval(
                    () => serviceConnection.updateAnalyticSessionEvents(newID, getAnalyticSessionEvents()),
                    2000
                );
                callback?.(detail);
            }
        });
        return;
    }

    if (requestType === 'STOP') {
        if (!currentSessionId) {
            console.warn('No active session');
            return;
        }

        const validSessionId = currentSessionId;
        clearInterval(analyticsHeartbeat);
        serviceConnection.updateAnalyticSessionEvents(validSessionId, getAnalyticSessionEvents(), () => {
            // Clear session events
            sessionEvents = {};
            serviceConnection.analyticsSessionRequest(requestType, validSessionId, callback);
            currentSessionId = undefined;
        });
    }
}

/**
 * Used to stop an analytics session with an optional callback
 * @param applicationName - Name of application
 * @param options - See {@link StartAnalyticsSessionOptions}
 *
 * @public
 */
export function startAnalyticsSession(applicationName: string, options?: StartAnalyticsSessionOptions) {
    if (options?.stopCurrentSession && currentSessionId) {
        controlAnalyticsSession('STOP', applicationName, (detail) => {
            controlAnalyticsSession('START', applicationName, options.callback);
            options.callback?.(detail);
        });
        return;
    }

    controlAnalyticsSession('START', applicationName, options?.callback);
}

/**
 * Used to stop an analytics session with an optional callback
 * @param applicationName - Name of application
 * @param options - See {@link StopAnalyticsSessionOptions}
 *
 * @public
 */
export function stopAnalyticsSession(applicationName: string, options?: StopAnalyticsSessionOptions) {
    controlAnalyticsSession('STOP', applicationName, options?.callback);
}
