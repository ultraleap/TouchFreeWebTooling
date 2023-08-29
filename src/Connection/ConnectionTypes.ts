// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessageReceiver } from '_internal';

/**
 * Custom IP and port to connect to Service on
 *
 * @public
 */
export interface Address {
    /** Optional IP Address */
    ip?: string;
    /** Optional Port */
    port?: string;
}

/**
 * Initialization parameters for ConnectionManager
 *
 * @public
 */
export interface InitParams {
    address?: Address;
}

/**
 * State of the Ultraleap Tracking Service that TouchFree Service connects to
 * @public
 */
export enum TrackingServiceState {
    /** The TouchFree service is not connected to the tracking service */
    UNAVAILABLE,
    /** The TouchFree service is connected to the tracking service but there is not a camera connected */
    NO_CAMERA,
    /** The TouchFree service is connected to the tracking service */
    CONNECTED,
}

/**
 * State of a configuration file
 * @public
 */
export enum ConfigurationState {
    /** The TouchFree configuration has not been loaded */
    NOT_LOADED,
    /** The TouchFree configuration has successfully been loaded */
    LOADED,
    /** The TouchFree configuration errored on load */
    ERRORED,
}

/**
 * Hand presence enumeration
 * @public
 */
export enum HandPresenceState {
    /** Sent when the first hand is found when no hands were present previously */
    HAND_FOUND,
    /** Sent when the last observed hand is lost, meaning no more hands are observed */
    HANDS_LOST,
    /**
     * Used to indicate that no change in state is awaiting processing.
     *
     * See usage in {@link MessageReceiver} for more details.
     * @internal
     */
    PROCESSED,
}

/**
 * Interaction zone states
 * @public
 */
export enum InteractionZoneState {
    /** Sent when the "active" hand enters the interaction zone */
    HAND_ENTERED,
    /** Sent when the "active" hand leaves the interaction zone */
    HAND_EXITED,
}
