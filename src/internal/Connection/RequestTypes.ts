import { PhysicalConfig, InteractionConfig, DeepPartial } from '../Configuration/ConfigurationTypes';
import { Mask } from '../Tracking/TrackingTypes';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ActionCode } from './ActionCode';
import { TrackingServiceState, ConfigurationState, ServiceState } from './ConnectionTypes';

/**
 * Data structure used as a base for sending requests to the TouchFree Service
 * @internal
 */
export interface TouchFreeRequest {
    /** Request ID */
    requestID: string;
}

/**
 * Data structure for request callbacks
 * @internal
 */
export interface TouchFreeRequestCallback<T> {
    /** Timestamp the request was sent
     * @remarks
     * Typically used to clear request callbacks that exceed a timeout
     */
    timestamp: number;
    /** The callback the request should call */
    callback: (detail: T) => void;
}

/**
 * @internal
 */
export type WebSocketCallback = (detail: WebSocketResponse) => void;

/**
 * Outer container for {@link TrackingStateResponse} properties, including success state and a
 * message with property content
 * @internal
 */
export interface SuccessWrapper<T> {
    /** Success state */
    succeeded: boolean;
    /** Message */
    msg: string;
    /** Content of response */
    content?: T;
}

/**
 * Data structure for all TouchFree configuration
 * @internal
 */
export interface ConfigState extends TouchFreeRequest {
    /** See {@link InteractionConfig} */
    interaction: InteractionConfig;
    /** See {@link PhysicalConfig} */
    physical: PhysicalConfig;
}

/**
 * Data structure used to send requests changing configuration or configuration files.
 *
 * @remarks
 * All properties are optional - configuration not included is not modified
 * @internal
 */
export type PartialConfigState = DeepPartial<ConfigState>;

/**
 * Response data structure for {@link ActionCode.GET_TRACKING_STATE} and {@link ActionCode.SET_TRACKING_STATE} requests
 * @internal
 */
export interface TrackingStateResponse extends TouchFreeRequest {
    /** RequestID */
    requestID: string;
    /** Optional {@link Mask} config state */
    mask: SuccessWrapper<Mask> | null;
    /** Optional camera orientation config state*/
    cameraReversed: SuccessWrapper<boolean> | null;
    /** Optional allow images config state */
    allowImages: SuccessWrapper<boolean> | null;
    /** Optional analytics config state */
    analyticsEnabled: SuccessWrapper<boolean> | null;
}

/**
 * Data structure for {@link ActionCode.REQUEST_SERVICE_STATUS} and {@link ActionCode.SERVICE_STATUS} requests
 * @internal
 */
export interface ServiceStateResponse extends TouchFreeRequest {
    /** See {@link TrackingServiceState} */
    trackingServiceState: TrackingServiceState;
    /** See {@link ConfigurationState} */
    configurationState: ConfigurationState;
    /** Service Version */
    serviceVersion: string;
    /** Tracking Version */
    trackingVersion: string;
    /** Camera Serial Number */
    cameraSerial: string;
    /** Camera Firmware Version */
    cameraFirmwareVersion: string;
}

/**
 * General purpose request response type
 * @internal
 */
export interface WebSocketResponse extends TouchFreeRequest {
    /** Response status */
    status: string;
    /** Message included with this response */
    message: string;
    /**
     * Original request this response is to, included for debugging purposes
     */
    originalRequest: string;
}

/**
 * Response data structure for {@link ActionCode.VERSION_HANDSHAKE_RESPONSE}
 * @internal
 */
export interface VersionHandshakeResponse extends WebSocketResponse {
    /** TouchFree Service Semantic Versioning */
    touchFreeVersion: string;
    /** Client-Service communication API Semantic Versioning */
    apiVersion: string;
}

/**
 * Request data structure for {@link ActionCode.SET_TRACKING_STATE} request
 * @internal
 */
export interface TrackingStateRequest extends TouchFreeRequest {
    /** See {@link Mask} */
    mask: Mask;
    /** Is camera orientation reversed from default? */
    cameraReversed: boolean;
    /** Allow images */
    allowImages: boolean;
    /** Analytics enabled */
    analyticsEnabled: boolean;
}

/**
 * Used to set the state of the Hand Render Data stream.
 * @internal
 */
export interface HandRenderDataStateRequest extends TouchFreeRequest {
    /** Enabled */
    enabled: boolean;
    /** Lens */
    lens: string;
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
