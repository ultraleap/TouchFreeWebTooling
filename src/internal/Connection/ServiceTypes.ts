import { ActionCode } from './ActionCode';
import { HandPresenceState, InteractionZoneState } from './ConnectionTypes';

/**
 * Object with versions for comparing the {@link VERSIONINFO.API_VERSION} of the Tooling and the Service.
 *
 * @internal
 */
export const VERSIONINFO = {
    /**
     * The current version of communication API used between Tooling and the TouchFree Service
     */
    API_VERSION: '1.5.0',

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
 * Enumeration of client-service compatibility
 * @deprecated Unused
 * @internal
 */
export enum Compatibility {
    /** The API versions are considered compatible */
    COMPATIBLE,
    /** The API versions are considered incompatible as Service is older than Tooling */
    SERVICE_OUTDATED,
    /** The API versions are considered incompatible as Tooling is older than Service */
    TOOLING_OUTDATED,
}

/**
 * Data structure for {@link ActionCode.HAND_PRESENCE_EVENT} messages
 * @internal
 */
export class HandPresenceEvent {
    /** Type of the current event. See {@link HandPresenceState} */
    state: HandPresenceState;

    constructor(state: HandPresenceState) {
        this.state = state;
    }
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
export class CommunicationWrapper<T> {
    /** See {@link ActionCode} */
    action: ActionCode;
    /** Wrapped content */
    content: T;

    constructor(actionCode: ActionCode, content: T) {
        this.action = actionCode;
        this.content = content;
    }
}
