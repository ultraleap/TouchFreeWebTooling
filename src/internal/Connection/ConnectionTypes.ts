import { ServiceStateResponse } from './RequestTypes';

/**
 * Custom IP and port to connect to Service on
 * @public
 */
export interface Address {
    /** Optional IP Address */
    ip?: string;
    /** Optional Port */
    port?: string;
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

/**
 * State including TouchFree service/config, tracking service and camera
 * @public
 */
export interface ServiceState {
    /** See {@link TrackingServiceState} */
    trackingServiceState: TrackingServiceState;
    /** See {@link ConfigurationState} */
    configurationState: ConfigurationState;
    /** Service Version */
    touchFreeServiceVersion: string;
    /** Tracking Version */
    trackingServiceVersion: string;
    /** Camera Serial Number */
    cameraSerial: string;
    /** Camera Firmware Version */
    cameraFirmwareVersion: string;
}

/**
 * Converts a response type to {@link ServiceState}
 * @param response - Response object from the service
 * @returns Converted ServiceState
 * @internal
 */
export function convertResponseToServiceState(response: ServiceStateResponse): ServiceState {
    return {
        cameraFirmwareVersion: response.cameraFirmwareVersion,
        cameraSerial: response.cameraSerial,
        configurationState: response.configurationState,
        touchFreeServiceVersion: response.serviceVersion,
        trackingServiceState: response.trackingServiceState,
        trackingServiceVersion: response.trackingVersion,
    };
}

/**
 * General purpose response type
 * @public
 */
export interface ResponseState {
    /** Response status - usually success or failure */
    status: string;
    /** Message accompanying the response */
    message: string;
}

/**
 * General purpose response callback
 * @public
 */
export type ResponseCallback = (state: ResponseState) => void;
