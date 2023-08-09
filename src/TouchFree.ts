import { Address, ConnectionManager } from './Connection/ConnectionManager';
import {
    AnalyticSessionEvents,
    AnalyticEventKey,
    AnalyticsSessionRequestType,
    WebSocketResponse,
} from './Connection/TouchFreeServiceTypes';
import { SVGCursor } from './Cursors/SvgCursor';
import { TouchlessCursor } from './Cursors/TouchlessCursor';
import { WebInputController } from './InputControllers/WebInputController';
import { HandDataManager } from './Plugins/HandDataManager';
import { InputActionManager } from './Plugins/InputActionManager';
import { TouchFreeEvent, TouchFreeEventSignatures } from './TouchFreeToolingTypes';
import { v4 as uuidgen } from 'uuid';

/**
 * Global input controller initialized by {@link Init}
 * @public
 */
let InputController: WebInputController | undefined;

/**
 * Global cursor initialized by {@link Init}
 * @public
 */
let CurrentCursor: TouchlessCursor | undefined;
let CurrentSessionId: string | undefined;

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

const GetCurrentCursor = () => CurrentCursor;
const SetCurrentCursor = (cursor: TouchlessCursor | undefined) => (CurrentCursor = cursor);
const GetInputController = () => InputController;

const IsAnalyticsActive = () => CurrentSessionId !== undefined;

/**
 * Initializes TouchFree - must be called before any functionality requiring a TouchFree service connection.
 *
 * @param _tfInitParams - Optional extra initialization parameters
 * @public
 */
const Init = (tfInitParams?: TfInitParams): void => {
    ConnectionManager.init({ address: tfInitParams?.address });

    InputController = new WebInputController();

    if (tfInitParams === undefined) {
        CurrentCursor = new SVGCursor();
    } else {
        if (tfInitParams.initialiseCursor === undefined || tfInitParams.initialiseCursor === true) {
            CurrentCursor = new SVGCursor();
        }
    }
};

const analyticEvents: { [key in AnalyticEventKey]?: () => void } = {};
// Function: GetRegisteredAnalyticEvents
// Returns a list of registered analytic event keys
const GetRegisteredAnalyticEventKeys = (): string[] => Object.keys(analyticEvents);

let sessionEvents: AnalyticSessionEvents = {};
// Function: GetRegisteredAnalyticEvents
// Returns a copy of an indexed object detailing how many times each analytics event has been trigger
const GetAnalyticSessionEvents = (): AnalyticSessionEvents => Object.assign({}, sessionEvents);

const defaultAnalyticEvents: AnalyticEventKey[] = ['touchstart', 'touchmove', 'touchend'];

// Function: RegisterAnalyticEvents
// Registers a given list of event for the TouchFree service to record.
// If no list of events is provided then the default set of events will be recorded.
const RegisterAnalyticEvents = (eventsIn: AnalyticEventKey[] = defaultAnalyticEvents) => {
    eventsIn.forEach((evt) => {
        if (analyticEvents[evt]) return;
        const onEvent = () => {
            const eventCount = sessionEvents[evt];
            sessionEvents[evt] = eventCount === undefined ? 1 : eventCount + 1;
        };
        analyticEvents[evt] = onEvent;
        document.addEventListener(evt, onEvent, true);
    });
};

// Function: UnregisterAnalyticEvents
// Unregister any registered analytic events.
// If no list of events is provided then all registered analytic events will be unregistered.
const UnregisterAnalyticEvents = (eventsIn?: AnalyticEventKey[]) => {
    const events: AnalyticEventKey[] = eventsIn ?? (Object.keys(analyticEvents) as AnalyticEventKey[]);

    events.forEach((evt) => {
        const evtFunc = analyticEvents[evt];
        if (evtFunc) {
            document.removeEventListener(evt, evtFunc, true);
            delete analyticEvents[evt];
        }
    });
};

/**
 * Are we connected to the TouchFree service?
 *
 * @returns Whether connected to TouchFree service or not.
 * @public
 */
const IsConnected = (): boolean => ConnectionManager.IsConnected;

let analyticsHeartbeat: number;

type WebSocketCallback = (detail: WebSocketResponse) => void;

// Function: ControlAnalyticsSession
// Used to start or stop an analytics session.
const ControlAnalyticsSession = (
    requestType: AnalyticsSessionRequestType,
    application: string,
    callback?: WebSocketCallback
) => {
    const serviceConnection = ConnectionManager.serviceConnection();
    if (!serviceConnection) return;

    if (requestType === 'START') {
        if (CurrentSessionId) {
            console.warn(`Session: ${CurrentSessionId} already in progress`);
            return;
        }
        const newID = `${application}:${uuidgen()}`;

        serviceConnection.AnalyticsSessionRequest(requestType, newID, (detail) => {
            if (detail.status !== 'Failure') {
                CurrentSessionId = newID;
                analyticsHeartbeat = window.setInterval(
                    () => serviceConnection.UpdateAnalyticSessionEvents(newID),
                    2000
                );
                callback?.(detail);
            }
        });
        return;
    }

    if (requestType === 'STOP') {
        if (!CurrentSessionId) {
            console.warn('No active session');
            return;
        }

        const validSessionId = CurrentSessionId;
        clearInterval(analyticsHeartbeat);
        serviceConnection.UpdateAnalyticSessionEvents(validSessionId, () => {
            // Clear session events
            sessionEvents = {};
            serviceConnection.AnalyticsSessionRequest(requestType, validSessionId, callback);
            CurrentSessionId = undefined;
        });
    }
};

interface StopAnalyticsSessionOptions {
    callback?: WebSocketCallback;
}

// Function StopAnalyticsSession
// Used to stop an analytics session with an optional callback
const StopAnalyticsSession = (applicationName: string, options?: StopAnalyticsSessionOptions) => {
    ControlAnalyticsSession('STOP', applicationName, options?.callback);
};

interface StartAnalyticsSessionOptions {
    callback?: WebSocketCallback;
    stopCurrentSession?: boolean;
}

// Function StartAnalyticsSession
// Used to start an analytics session with an optional callback and flag to stop the currently running session
const StartAnalyticsSession = (applicationName: string, options?: StartAnalyticsSessionOptions) => {
    if (options?.stopCurrentSession && CurrentSessionId) {
        ControlAnalyticsSession('STOP', applicationName, (detail) => {
            ControlAnalyticsSession('START', applicationName, options.callback);
            options.callback?.(detail);
        });
        return;
    }

    ControlAnalyticsSession('START', applicationName, options?.callback);
};

/**
 * Object that can unregister a callback from an event
 * @public
 */
export interface EventHandle {
    /**
     * Unregister the callback represented by this object
     */
    UnregisterEventCallback(): void;
}

/**
 * Turns a callback with an argument into a {@link CustomEvent} Event Listener
 *
 * @param callback - The callback to wrap
 * @returns EventListener with the wrapper callback
 */
const MakeCustomEventWrapper = <T>(callback: (arg: T) => void): EventListener => {
    return ((evt: CustomEvent<T>) => {
        callback(evt.detail);
    }) as EventListener;
};

/**
 * Signature required for RegisterEvent functions
 */
type RegisterEventFunc = (target: EventTarget, eventType: TouchFreeEvent, listener: EventListener) => EventHandle;

/**
 * Default implementation of RegisterEvent
 */
const DefaultRegisterEventFunc: RegisterEventFunc = (target, eventType, listener) => {
    target.addEventListener(eventType, listener);
    return { UnregisterEventCallback: () => target.removeEventListener(eventType, listener) };
};

/**
 * Interface for each individual event's implementation details
 */
interface EventImpl<T extends TouchFreeEvent> {
    Target: EventTarget;
    WithCallback: (callback: TouchFreeEventSignatures[T]) => {
        Listener: EventListener;
        RegisterEventFunc: RegisterEventFunc;
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
let EventImplementationsBackingField: EventImpls | undefined;

/**
 * Implementation details for all events
 *
 * @remarks
 * Any new events added to TouchFreeEvent require a new entry here to function
 *
 * @returns A function that returns all event implementations
 */
const EventImplementations: () => EventImpls = () =>
    (EventImplementationsBackingField ??= {
        OnConnected: {
            Target: ConnectionManager.instance,
            WithCallback: (callback) => ({
                Listener: callback, // Void callback can be returned directly
                RegisterEventFunc: DefaultRegisterEventFunc,
            }),
        },
        WhenConnected: {
            Target: ConnectionManager.instance,
            WithCallback: (callback) => ({
                Listener: callback, // Void callback can be returned directly
                RegisterEventFunc: (_target, _eventType, _listener) => {
                    // If we're already connected then run the callback
                    if (IsConnected()) {
                        callback();
                    }

                    // Piggyback OnConnected
                    return RegisterEventCallback('OnConnected', callback);
                },
            }),
        },
        OnServiceStatusChange: {
            Target: ConnectionManager.instance,
            WithCallback: (callback) => ({
                Listener: MakeCustomEventWrapper(callback),
                RegisterEventFunc: DefaultRegisterEventFunc,
            }),
        },
        OnTrackingServiceStateChange: {
            Target: ConnectionManager.instance,
            WithCallback: (callback) => ({
                Listener: MakeCustomEventWrapper(callback),
                RegisterEventFunc: DefaultRegisterEventFunc,
            }),
        },
        HandFound: {
            Target: ConnectionManager.instance,
            WithCallback: (callback) => ({
                Listener: callback, // Void callback can be returned directly
                RegisterEventFunc: DefaultRegisterEventFunc,
            }),
        },
        HandsLost: {
            Target: ConnectionManager.instance,
            WithCallback: (callback) => ({
                Listener: callback, // Void callback can be returned directly
                RegisterEventFunc: DefaultRegisterEventFunc,
            }),
        },
        InputAction: {
            Target: InputActionManager.instance,
            WithCallback: (callback) => ({
                Listener: MakeCustomEventWrapper(callback),
                RegisterEventFunc: DefaultRegisterEventFunc,
            }),
        },
        TransmitHandData: {
            Target: HandDataManager.instance,
            WithCallback: (callback) => ({
                Listener: MakeCustomEventWrapper(callback),
                RegisterEventFunc: DefaultRegisterEventFunc,
            }),
        },
        TransmitInputAction: {
            Target: InputActionManager.instance,
            WithCallback: (callback) => ({
                Listener: MakeCustomEventWrapper(callback),
                RegisterEventFunc: DefaultRegisterEventFunc,
            }),
        },
        TransmitInputActionRaw: {
            Target: InputActionManager.instance,
            WithCallback: (callback) => ({
                Listener: MakeCustomEventWrapper(callback),
                RegisterEventFunc: DefaultRegisterEventFunc,
            }),
        },
        HandEntered: {
            Target: ConnectionManager.instance,
            WithCallback: (callback) => ({
                Listener: callback, // Void callback can be returned directly
                RegisterEventFunc: DefaultRegisterEventFunc,
            }),
        },
        HandExited: {
            Target: ConnectionManager.instance,
            WithCallback: (callback) => ({
                Listener: callback, // Void callback can be returned directly
                RegisterEventFunc: DefaultRegisterEventFunc,
            }),
        },
    });

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
const RegisterEventCallback = <TEvent extends TouchFreeEvent>(
    event: TEvent,
    callback: TouchFreeEventSignatures[TEvent]
): EventHandle => {
    const eventImpl = EventImplementations()[event];
    const target = eventImpl.Target;
    const callbackImpl = eventImpl.WithCallback(callback);
    const listener = callbackImpl.Listener;
    return callbackImpl.RegisterEventFunc(target, event, listener);
};

/**
 * Dispatches an event of the specific type with arguments if the event requires any.
 *
 * @remarks
 * For details of events and their expected arguments see comment above {@link RegisterEventCallback}
 *
 * @param eventType - The event to register a callback to. See {@link TouchFreeEvent}
 * @param args - Arguments for the event. Depends on the event being dispatched. See {@link TouchFreeEventSignatures}
 *
 * @public
 */
export const DispatchEvent = <TEvent extends TouchFreeEvent>(
    eventType: TEvent,
    ...args: Parameters<TouchFreeEventSignatures[TEvent]>
) => {
    let event: Event;
    if (args.length === 0) {
        event = new Event(eventType);
    } else {
        event = new CustomEvent(eventType, { detail: args[0] });
    }

    const target = EventImplementations()[eventType].Target;
    target.dispatchEvent(event);
};

// Bundle all our exports into a default object
// Benefit to this is IDE autocomplete for "TouchFree" will find this object
/**
 * Top level TouchFree object - an entry point for using TouchFree
 *
 * @public
 */
export const TouchFree = {
    CurrentCursor,
    GetCurrentCursor,
    SetCurrentCursor,
    DispatchEvent,
    Init,
    InputController,
    GetInputController,
    IsConnected,
    RegisterEventCallback,
    RegisterAnalyticEvents,
    UnregisterAnalyticEvents,
    IsAnalyticsActive,
    GetRegisteredAnalyticEventKeys,
    GetAnalyticSessionEvents,
    StartAnalyticsSession,
    StopAnalyticsSession,
};
export default TouchFree;
