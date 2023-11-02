import { ActionCode } from './ActionCode';
import { InteractionZoneState } from './ConnectionTypes';

/**
 * Object with versions for comparing the {@link VERSION_INFO.API_VERSION} of the Tooling and the Service.
 *
 * @internal
 */
export const VERSION_INFO = {
    /**
     * The current version of communication API used between Tooling and the TouchFree Service
     */
    API_VERSION: '1.6.0',

    /**
     * The name of the header we wish the Service to compare our version with.
     */
    API_HEADER_NAME: 'TfApiVersion',
};

/**
 * Represents whether the event has been processed by the service
 * @internal
 */
export type EventStatus = 'PROCESSED' | 'UNPROCESSED';

/**
 * Generic interface for handling events from the service.
 * @internal
 */
export interface EventUpdate<T> {
    /** Indicates whether the event has been processed by the service */
    status: EventStatus;
    /** The received state from the event */
    state: T;
}

/**
 * This data structure for {@link ActionCode.INTERACTION_ZONE_EVENT} messages
 * @internal
 */
export interface InteractionZoneEvent {
    /** Type of the current event. See {@link InteractionZoneState} */
    state: InteractionZoneState;
}

/**
 * Container used to wrap request data structures with an {@link ActionCode}
 * @internal
 */
export interface CommunicationWrapper<T> {
    /** See {@link ActionCode} */
    action: ActionCode;
    /** Wrapped content */
    content: T;
}
