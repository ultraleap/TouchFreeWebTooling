import { Address, ConnectionManager } from './Connection/ConnectionManager';
import { AnalyticEventKey, AnalyticsSessionRequestType, WebSocketResponse } from './Connection/TouchFreeServiceTypes';
import { SVGCursor } from './Cursors/SvgCursor';
import { TouchlessCursor } from './Cursors/TouchlessCursor';
import { WebInputController } from './InputControllers/WebInputController';
import { HandDataManager } from './Plugins/HandDataManager';
import { InputActionManager } from './Plugins/InputActionManager';
import { TouchFreeEvent, TouchFreeEventSignatures } from './TouchFreeToolingTypes';
import { v4 as uuidgen } from 'uuid';

/**
 * Global input controller initialized by {@link init}
 * @public
 */
let inputController: WebInputController | undefined;

/**
 * Global cursor initialized by {@link init}
 * @public
 */
let currentCursor: TouchlessCursor | undefined;
let currentSessionId: string | undefined;

/**
 * Extra options for initializing TouchFree
 * @public
 */
export interface TfInitParams {
    /**
     * If true or not provided a default {@link SVGCursor} will be created
     */
    initialiseCursor?: boolean;
    /**
     * Custom IP and port to connect to Service on. See {@link Address}
     */
    address?: Address;
}

/**
 * @returns The Cursor currently used by TouchFree
 * @public
 */
export const getCurrentCursor = () => currentCursor;

/**
 * Sets the cursor to be used by TouchFree
 * @param cursor - The cursor to be used. Can be `undefined` to unset.
 * @public
 */
export const setCurrentCursor = (cursor?: TouchlessCursor) => (currentCursor = cursor);

/**
 * @returns The current inputController
 * @public
 */
export const getInputController = () => inputController;

/**
 * @returns `true` if there is an active analytics session, `false` otherwise
 * @public
 */
export const isAnalyticsActive = () => currentSessionId !== undefined;

/**
 * Initializes TouchFree - must be called before any functionality requiring a TouchFree service connection.
 *
 * @param tfInitParams - Optional extra initialization parameters
 * @public
 */
export function init(tfInitParams?: TfInitParams): void {
    ConnectionManager.init({ address: tfInitParams?.address });

    inputController = new WebInputController();

    if (tfInitParams === undefined) {
        currentCursor = new SVGCursor();
    } else {
        if (tfInitParams.initialiseCursor === undefined || tfInitParams.initialiseCursor === true) {
            currentCursor = new SVGCursor();
        }
    }
}

const analyticEvents: { [key in AnalyticEventKey]?: (e: Event) => void } = {};

/** Returns the list of registered analytic event keys */
export function getRegisteredAnalyticEventKeys(): string[] {
    return Object.keys(analyticEvents);
}

let sessionEvents: AnalyticSessionEvents = {};

/**
 * Index object of {@link AnalyticEventKey} to number
 * @public
 */
export type AnalyticSessionEvents = { [key in AnalyticEventKey]?: number };

/**
 * Returns a copy of an indexed object detailing how many times each analytics event has been triggered
 * @public
 */
export const getAnalyticSessionEvents = (): AnalyticSessionEvents => Object.assign({}, sessionEvents);

const defaultAnalyticEvents: readonly AnalyticEventKey[] = ['touchstart', 'touchmove', 'touchend'];

const isTFPointerEvent = (e: Event): boolean => 'pointerType' in e && e.pointerType === 'pen' && !e.isTrusted;

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
 * Are we connected to the TouchFree service?
 *
 * @returns Whether connected to TouchFree service or not.
 * @public
 */
const isConnected = (): boolean => ConnectionManager.isConnected;

let analyticsHeartbeat: number;

type WebSocketCallback = (detail: WebSocketResponse) => void;

/**
 * Used to start or stop an analytics session
 *
 * @param requestType - START or STOP session. See {@link AnalyticsSessionRequestType}
 * @param application - Name of application
 * @param callback - Optional callback to handle Service's response
 *
 * @internal
 */
function controlAnalyticsSession(
    requestType: AnalyticsSessionRequestType,
    application: string,
    callback?: WebSocketCallback
) {
    const serviceConnection = ConnectionManager.serviceConnection();
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
                    () => serviceConnection.updateAnalyticSessionEvents(newID),
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
        serviceConnection.updateAnalyticSessionEvents(validSessionId, () => {
            // Clear session events
            sessionEvents = {};
            serviceConnection.analyticsSessionRequest(requestType, validSessionId, callback);
            currentSessionId = undefined;
        });
    }
}

/**
 * Options to use with {@link StopAnalyticsSession}
 *
 * @public
 */
export interface StopAnalyticsSessionOptions {
    callback?: WebSocketCallback;
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

/**
 * Options to use with {@link StartAnalyticsSession}
 *
 * @public
 */
export interface StartAnalyticsSessionOptions {
    callback?: WebSocketCallback;
    stopCurrentSession?: boolean;
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
 * Object that can unregister a callback from an event
 * @public
 */
export interface EventHandle {
    /**
     * Unregister the callback represented by this object
     */
    unregisterEventCallback(): void;
}

/**
 * Turns a callback with an argument into a {@link CustomEvent} Event Listener
 *
 * @param callback - The callback to wrap
 * @returns EventListener with the wrapper callback
 */
function makeCustomEventWrapper<T>(callback: (arg: T) => void): EventListener {
    return ((evt: CustomEvent<T>) => {
        callback(evt.detail);
    }) as EventListener;
}

/**
 * Signature required for RegisterEvent functions
 */
type RegisterEventFunc = (target: EventTarget, eventType: TouchFreeEvent, listener: EventListener) => EventHandle;

/**
 * Default implementation of RegisterEvent
 */
const defaultRegisterEventFunc: RegisterEventFunc = (target, eventType, listener) => {
    target.addEventListener(eventType, listener);
    return { unregisterEventCallback: () => target.removeEventListener(eventType, listener) };
};

/**
 * Interface for each individual event's implementation details
 */
interface EventImpl<T extends TouchFreeEvent> {
    target: EventTarget;
    withCallback: (callback: TouchFreeEventSignatures[T]) => {
        listener: EventListener;
        registerEventFunc: RegisterEventFunc;
    };
}

/**
 * Mapped type of Event implementations for each {@link TouchFreeEvent}
 */
type EventImpls = {
    [T in TouchFreeEvent]: EventImpl<T>;
};

/**
 * Backing field to cache object creation
 */
let eventImplementationsBackingField: EventImpls | undefined;

/**
 * Implementation details for all events
 *
 * @remarks
 * Any new events added to TouchFreeEvent require a new entry here to function
 *
 * @returns A function that returns all event implementations
 */
function eventImplementations(): EventImpls {
    return (eventImplementationsBackingField ??= {
        onConnected: {
            target: ConnectionManager.instance,
            withCallback: (callback) => ({
                listener: callback, // Void callback can be returned directly
                registerEventFunc: defaultRegisterEventFunc,
            }),
        },
        whenConnected: {
            target: ConnectionManager.instance,
            withCallback: (callback) => ({
                listener: callback, // Void callback can be returned directly
                registerEventFunc: (_target, _eventType, _listener) => {
                    // If we're already connected then run the callback
                    if (isConnected()) {
                        callback();
                    }

                    // Piggyback onConnected
                    return registerEventCallback('onConnected', callback);
                },
            }),
        },
        onServiceStatusChange: {
            target: ConnectionManager.instance,
            withCallback: (callback) => ({
                listener: makeCustomEventWrapper(callback),
                registerEventFunc: defaultRegisterEventFunc,
            }),
        },
        onTrackingServiceStateChange: {
            target: ConnectionManager.instance,
            withCallback: (callback) => ({
                listener: makeCustomEventWrapper(callback),
                registerEventFunc: defaultRegisterEventFunc,
            }),
        },
        handFound: {
            target: ConnectionManager.instance,
            withCallback: (callback) => ({
                listener: callback, // Void callback can be returned directly
                registerEventFunc: defaultRegisterEventFunc,
            }),
        },
        handsLost: {
            target: ConnectionManager.instance,
            withCallback: (callback) => ({
                listener: callback, // Void callback can be returned directly
                registerEventFunc: defaultRegisterEventFunc,
            }),
        },
        inputAction: {
            target: InputActionManager.instance,
            withCallback: (callback) => ({
                listener: makeCustomEventWrapper(callback),
                registerEventFunc: defaultRegisterEventFunc,
            }),
        },
        transmitHandData: {
            target: HandDataManager.instance,
            withCallback: (callback) => ({
                listener: makeCustomEventWrapper(callback),
                registerEventFunc: defaultRegisterEventFunc,
            }),
        },
        transmitInputAction: {
            target: InputActionManager.instance,
            withCallback: (callback) => ({
                listener: makeCustomEventWrapper(callback),
                registerEventFunc: defaultRegisterEventFunc,
            }),
        },
        transmitInputActionRaw: {
            target: InputActionManager.instance,
            withCallback: (callback) => ({
                listener: makeCustomEventWrapper(callback),
                registerEventFunc: defaultRegisterEventFunc,
            }),
        },
        handEntered: {
            target: ConnectionManager.instance,
            withCallback: (callback) => ({
                listener: callback, // Void callback can be returned directly
                registerEventFunc: defaultRegisterEventFunc,
            }),
        },
        handExited: {
            target: ConnectionManager.instance,
            withCallback: (callback) => ({
                listener: callback, // Void callback can be returned directly
                registerEventFunc: defaultRegisterEventFunc,
            }),
        },
    });
}

/**
 * Registers a callback function to be called when a specific event occurs
 *
 * @param event - The event to register a callback to. See {@link TouchFreeEvent}
 * @param callback - The callback to register. Callback signature depends on event being registered.
 * See {@link TouchFreeEventSignatures}
 * @returns An {@link EventHandle} that can be used to unregister the callback
 *
 * @public
 */
export function registerEventCallback<TEvent extends TouchFreeEvent>(
    event: TEvent,
    callback: TouchFreeEventSignatures[TEvent]
): EventHandle {
    const eventImpl = eventImplementations()[event];
    const target = eventImpl.target;
    const callbackImpl = eventImpl.withCallback(callback);
    const listener = callbackImpl.listener;
    return callbackImpl.registerEventFunc(target, event, listener);
}

/**
 * Dispatches an event of the specific type with arguments if the event requires any.
 *
 * @remarks
 * For details of events and their expected arguments see {@link RegisterEventCallback}
 *
 * @param eventType - The event to register a callback to. See {@link TouchFreeEvent}
 * @param args - Arguments for the event. Depends on the event being dispatched. See {@link TouchFreeEventSignatures}
 *
 * @public
 */
export function dispatchEvent<TEvent extends TouchFreeEvent>(
    eventType: TEvent,
    ...args: Parameters<TouchFreeEventSignatures[TEvent]>
) {
    let event: Event;
    if (args.length === 0) {
        event = new Event(eventType);
    } else {
        event = new CustomEvent(eventType, { detail: args[0] });
    }

    const target = eventImplementations()[eventType].target;
    target.dispatchEvent(event);
}
