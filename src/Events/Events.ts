import {
    ConnectionManager,
    InputActionManager,
    TouchFreeInputAction,
    TrackingServiceState,
    isConnected,
} from 'TouchFree';

import { HandDataManager, HandFrame, ServiceStatus } from '_internal';

/**
 * Names and signatures of all TouchFree events
 * @public
 */
export interface TouchFreeEventSignatures {
    /**
     * Event dispatched when connecting to the TouchFree service
     */
    onConnected: () => void;
    /**
     * Same as onConnected but calls callback when already connected.
     * Note this event piggybacks as an "onConnected" event on event targets.
     */
    whenConnected: () => void;
    /**
     * Event dispatched when the connection between TouchFreeService and Ultraleap Tracking Service changes
     */
    onTrackingServiceStateChange: (state: TrackingServiceState) => void;
    /**
     * Event dispatched when the status of TouchFree Service changes
     */
    onServiceStatusChange: (state: ServiceStatus) => void;
    /**
     * Event dispatched when the first hand has started tracking
     */
    handFound: () => void;
    /**
     * Event dispatched when the last hand has stopped tracking
     */
    handsLost: () => void;
    /**
     * Event dispatched when new hand data is available
     *
     * @remarks
     * Hand data in this event is in a non-standard space intended
     * for specific purposes. Not intended for general user consumption.
     *
     * @internal
     */
    transmitHandData: (data: HandFrame) => void;
    /**
     * Event dispatched when any input action is received from the TouchFree service
     */
    inputAction: (inputAction: TouchFreeInputAction) => void;
    /**
     * Event dispatched directly from the `InputActionManager` without any proxying
     */
    transmitInputActionRaw: (inputAction: TouchFreeInputAction) => void;
    /**
     * Event dispatched from the `InputActionManager` to each registered Plugin
     */
    transmitInputAction: (inputAction: TouchFreeInputAction) => void;
    /**
     * Event dispatched when the active hand enters the interaction zone
     */
    handEntered: () => void;
    /**
     * Event dispatched when the active hand enters the interaction zone
     */
    handExited: () => void;
}

/**
 * String literal union type of all events
 * @public
 */
export type TouchFreeEvent = Extract<keyof TouchFreeEventSignatures, string>;

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
 * For details of events and their expected arguments see {@link registerEventCallback}
 *
 * @param eventType - The event to register a callback to. See {@link TouchFreeEvent}
 * @param args - Arguments for the event. Depends on the event being dispatched. See {@link TouchFreeEventSignatures}
 *
 * @public
 */
export function dispatchEventCallback<TEvent extends TouchFreeEvent>(
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
