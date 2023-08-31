import { InteractionConfigFull, PhysicalConfig, InteractionConfig } from '../Configuration/ConfigurationTypes';
import { Mask } from '../Tracking/TrackingTypes';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ActionCode } from './ActionCode';
import { TrackingServiceState, ConfigurationState } from './ConnectionTypes';

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
export class ConfigState implements TouchFreeRequest {
    /** See {@link InteractionConfigFull} */
    interaction: InteractionConfigFull;
    /** See {@link PhysicalConfig} */
    physical: PhysicalConfig;
    /** Request ID */
    requestID: string;

    constructor(id: string, interaction: InteractionConfigFull, physical: PhysicalConfig) {
        this.requestID = id;
        this.interaction = interaction;
        this.physical = physical;
    }
}

/**
 * Data structure used to send requests changing configuration or configuration files.
 *
 * @remarks
 * All properties are optional - configuration not included is not modified
 * @internal
 */
export interface PartialConfigState extends TouchFreeRequest {
    /** Optional {@link InteractionConfig} */
    interaction?: Partial<InteractionConfig>;
    /** Optional {@link PhysicalConfig} */
    physical?: Partial<PhysicalConfig>;
}

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
export class ServiceStateResponse implements TouchFreeRequest {
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
    /** Request ID */
    requestID: string;

    constructor(
        id: string,
        trackingServiceState: TrackingServiceState,
        configurationState: ConfigurationState,
        serviceVersion: string,
        trackingVersion: string,
        cameraSerial: string,
        cameraFirmwareVersion: string
    ) {
        this.requestID = id;
        this.trackingServiceState = trackingServiceState;
        this.configurationState = configurationState;
        this.serviceVersion = serviceVersion;
        this.trackingVersion = trackingVersion;
        this.cameraSerial = cameraSerial;
        this.cameraFirmwareVersion = cameraFirmwareVersion;
    }
}

/**
 * General purpose request response type
 * @internal
 */
export class WebSocketResponse implements TouchFreeRequest {
    /** Response status */
    status: string;
    /** Message included with this response */
    message: string;
    /**
     * Original request this response is to, included for debugging purposes
     */
    originalRequest: string;
    /** Request ID */
    requestID: string;

    constructor(id: string, status: string, msg: string, request: string) {
        this.requestID = id;
        this.status = status;
        this.message = msg;
        this.originalRequest = request;
    }
}

/**
 * Response data structure for {@link ActionCode.VERSION_HANDSHAKE_RESPONSE}
 * @internal
 */
export class VersionHandshakeResponse extends WebSocketResponse {
    /** TouchFree Service Semantic Versioning */
    touchFreeVersion: string;
    /** Client-Service communication API Semantic Versioning */
    apiVersion: string;

    constructor(
        id: string,
        status: string,
        msg: string,
        request: string,
        touchFreeVersion: string,
        apiVersion: string
    ) {
        super(id, status, msg, request);
        this.touchFreeVersion = touchFreeVersion;
        this.apiVersion = apiVersion;
    }
}

/**
 * Request data structure for {@link ActionCode.SET_TRACKING_STATE} request
 * @internal
 */
export class TrackingStateRequest implements TouchFreeRequest {
    /** Request ID */
    requestID: string;
    /** See {@link Mask} */
    mask: Mask;
    /** Is camera orientation reversed from default? */
    cameraReversed: boolean;
    /** Allow images */
    allowImages: boolean;
    /** Analytics enabled */
    analyticsEnabled: boolean;

    constructor(id: string, mask: Mask, cameraReversed: boolean, allowImages: boolean, analyticsEnabled: boolean) {
        this.requestID = id;
        this.mask = mask;
        this.cameraReversed = cameraReversed;
        this.allowImages = allowImages;
        this.analyticsEnabled = analyticsEnabled;
    }
}

/**
 * Used to set the state of the Hand Render Data stream.
 * @internal
 */
export class HandRenderDataStateRequest implements TouchFreeRequest {
    /** Enabled */
    enabled: boolean;
    /** Lens */
    lens: string;
    /** Request ID */
    requestID: string;

    constructor(id: string, enabled: boolean, lens: string) {
        this.requestID = id;
        this.enabled = enabled;
        this.lens = lens;
    }
}
