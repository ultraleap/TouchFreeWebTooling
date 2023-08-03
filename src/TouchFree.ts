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

let InputController: WebInputController | undefined;
let CurrentCursor: TouchlessCursor | undefined;
let CurrentSessionId: string | undefined;

// Class: TfInitParams
// Extra options for use when initializing TouchFree
export interface TfInitParams {
    initialiseCursor?: boolean;
    address?: Address;
}

const GetCurrentCursor = () => CurrentCursor;
const SetCurrentCursor = (cursor: TouchlessCursor | undefined) => (CurrentCursor = cursor);
const GetInputController = () => InputController;

const IsAnalyticsActive = () => CurrentSessionId !== undefined;

// Function: Init
// Initializes TouchFree - must be called before any functionality requiring a TouchFree service connection.
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

// Function: IsConnected
// Are we connected to the TouchFree service?
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

// Class: EventHandle
// Object that can unregister a callback from an event
// Returned when registering a callback to an event
export interface EventHandle {
    UnregisterEventCallback(): void;
}

// Turns a callback with an argument into a CustomEvent<T> Event Listener
const MakeCustomEventWrapper = <T>(callback: (arg: T) => void): EventListener => {
    return ((evt: CustomEvent<T>) => {
        callback(evt.detail);
    }) as EventListener;
};

// Signature required for RegisterEvent functions
type RegisterEventFunc = (target: EventTarget, eventType: TouchFreeEvent, listener: EventListener) => EventHandle;

// Default implementation of RegisterEvent
const DefaultRegisterEventFunc: RegisterEventFunc = (target, eventType, listener) => {
    target.addEventListener(eventType, listener);
    return { UnregisterEventCallback: () => target.removeEventListener(eventType, listener) };
};

// Interface for each individual event's implementation details
interface EventImpl<T extends TouchFreeEvent> {
    Target: EventTarget;
    WithCallback: (callback: TouchFreeEventSignatures[T]) => {
        Listener: EventListener;
        RegisterEventFunc: RegisterEventFunc;
    };
}

type EventImpls = {
    [T in TouchFreeEvent]: EventImpl<T>;
};

// Backing field to cache object creation
let EventImplementationsBackingField: EventImpls | undefined;

// Implementation details for all events
// Any new events added to TouchFreeEvent require a new entry here to function
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
        OnLicenseStateChange: {
            Target: ConnectionManager.instance,
            WithCallback: (callback) => ({
                Listener: MakeCustomEventWrapper(callback),
                RegisterEventFunc: DefaultRegisterEventFunc,
            }),
        }
    });

// Function: RegisterEventCallback
// Registers a callback function to be called when a specific event occurs
// Returns an `EventHandle` that can be used to unregister the callback
//
// Events and expected callback signatures:
//
// OnConnected: () => void;
// Event dispatched when connecting to the TouchFree service
//
// WhenConnected: () => void;
// Same as OnConnected but calls callback when already connected.
// Note this event piggybacks as an "OnConnected" event on event targets.
//
// OnServiceStatusChanged: (state: ServiceStatus) => void;
// Event dispatched when TouchFree Service status changes.
//
// OnTrackingServiceStateChange: (state: TrackingServiceState) => void;
// Event dispatched when the connection between TouchFreeService and Ultraleap Tracking Service changes
//
// HandFound: () => void;
// Event dispatched when the first hand has started tracking
//
// HandsLost: () => void;
// Event dispatched when the last hand has stopped tracking
//
// TransmitHandData: (data: HandFrame) => void;
// Event dispatched when new hand data is available
//
// InputAction: (inputAction: TouchFreeInputAction) => void;
// Event dispatched when any input action is received from the TouchFree service
//
// TransmitInputActionRaw: (inputAction: TouchFreeInputAction) => void;
// Event dispatched directly from the <InputActionManager> without any proxying
//
// TransmitInputAction: (inputAction: TouchFreeInputAction) => void;
// Event dispatched from the <InputActionManager> to each registered Plugin
//
// HandEntered: () => void;
// Event dispatched when the active hand enters the interaction zone
//
// HandExited: () => void;
// Event dispatched when the active hand exits the interaction zone
//
// OnLicenseStateChange: (licenseState: LicenseState) => void;
// Event dispatched when the Licensing state of TouchFree Service changes
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

// Function: DispatchEvent
// Dispatches an event of the specific type with arguments if the event requires any.
// For details of events and their expected arguments see comment above RegisterEventCallback.
const DispatchEvent = <TEvent extends TouchFreeEvent>(
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
export default {
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
