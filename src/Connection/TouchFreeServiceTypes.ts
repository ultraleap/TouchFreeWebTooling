import { InteractionConfigFull, InteractionConfig, PhysicalConfig } from '../Configuration/ConfigurationTypes';
import { ConfigurationState, TrackingServiceState } from '../TouchFreeToolingTypes';
import { Mask } from '../Tracking/TrackingTypes';

/**
 * Action codes for requests between TouchFree Service and this client
 * @internal
 */
export enum ActionCode {
    /** Represents standard interaction data */
    INPUT_ACTION = 'INPUT_ACTION',

    /**
     * General configuration request response code.
     * Can represent success or failure with an included error message
     */
    CONFIGURATION_RESPONSE = 'CONFIGURATION_RESPONSE',
    /** Request current configuration state from the Service */
    REQUEST_CONFIGURATION_STATE = 'REQUEST_CONFIGURATION_STATE',
    /** Response for a {@link REQUEST_CONFIGURATION_STATE} request */
    CONFIGURATION_STATE = 'CONFIGURATION_STATE',
    /** Request change to configuration the Service */
    SET_CONFIGURATION_STATE = 'SET_CONFIGURATION_STATE',

    /**
     * An outgoing message from Tooling to Service which
     * compares client and service API versions for compatibility
     */
    VERSION_HANDSHAKE = 'VERSION_HANDSHAKE',
    /** Response code for a {@link VERSION_HANDSHAKE} */
    VERSION_HANDSHAKE_RESPONSE = 'VERSION_HANDSHAKE_RESPONSE',

    /** Message with hand presence event data sent by the Service */
    HAND_PRESENCE_EVENT = 'HAND_PRESENCE_EVENT',

    /** Represents a request to receive a current SERVICE_STATUS from the Service */
    REQUEST_SERVICE_STATUS = 'REQUEST_SERVICE_STATUS',
    /** Failure response from a {@link REQUEST_SERVICE_STATUS} request */
    SERVICE_STATUS_RESPONSE = 'SERVICE_STATUS_RESPONSE',
    /**
     * Message with information about the current state of the Service.
     *
     * @remarks
     * Can be a response to a {@link REQUEST_SERVICE_STATUS} request
     * or sent by the service when status changes
     */
    SERVICE_STATUS = 'SERVICE_STATUS',

    /** Request the state of configuration *files* */
    REQUEST_CONFIGURATION_FILE = 'REQUEST_CONFIGURATION_FILE',
    /** Response code for a {@link REQUEST_CONFIGURATION_FILE} request */
    CONFIGURATION_FILE_STATE = 'CONFIGURATION_FILE_STATE',
    /** Request changes to configuration *files* */
    SET_CONFIGURATION_FILE = 'SET_CONFIGURATION_FILE',
    /** Response code for a {@link SET_CONFIGURATION_FILE} request */
    CONFIGURATION_FILE_CHANGE_RESPONSE = 'CONFIGURATION_FILE_CHANGE_RESPONSE',
    /**
     * Response code for a {@link SET_CONFIGURATION_FILE} request
     * @deprecated for {@link CONFIGURATION_FILE_CHANGE_RESPONSE}
     */
    CONFIGURATION_FILE_RESPONSE = 'CONFIGURATION_FILE_RESPONSE',

    /** Represents a request for performing a quick setup of the Service */
    QUICK_SETUP = 'QUICK_SETUP',
    /**
     * Represents a response from the Service after a {@link QUICK_SETUP} request
     * where the configuration was updated as the quick setup was successfully completed.
     */
    QUICK_SETUP_CONFIG = 'QUICK_SETUP_CONFIG',
    /**
     * Represents a response from the Service after a {@link QUICK_SETUP} request
     * where the configuration was not updated.
     */
    QUICK_SETUP_RESPONSE = 'QUICK_SETUP_RESPONSE',

    /** Represents a request to receive the current state of the tracking settings */
    GET_TRACKING_STATE = 'GET_TRACKING_STATE',
    /** Represents a request to set the current state of the tracking settings */
    SET_TRACKING_STATE = 'SET_TRACKING_STATE',
    /**
     * Represents a response from the Service with the current state of the tracking settings,
     * received following a {@link GET_TRACKING_STATE} or {@link SET_TRACKING_STATE} request
     */
    TRACKING_STATE = 'TRACKING_STATE',

    /** Represents more complete hand data sent from the service. */
    HAND_DATA = 'HAND_DATA',

    /**
     * Represents a request to the Service to enable/disable
     * the {@link HAND_DATA} stream or change the lens to have the hand position relative to.
     */
    SET_HAND_DATA_STREAM_STATE = 'SET_HAND_DATA_STREAM_STATE',

    /**
     * Represents the interaction zone state received from the Service
     */
    INTERACTION_ZONE_EVENT = 'INTERACTION_ZONE_EVENT',

    /**
     * Represents a request to reset the interaction config to it's default state
     */
    RESET_INTERACTION_CONFIG_FILE = 'RESET_INTERACTION_CONFIG_FILE',

    /**
     * Represents a request to start or stop an analytics session
     */
    ANALYTICS_SESSION_REQUEST = 'ANALYTICS_SESSION_REQUEST',
    /**
     * Represents a request to update the non-TF analytic events for the current session
     */
    ANALYTICS_UPDATE_SESSION_EVENTS_REQUEST = 'ANALYTICS_UPDATE_SESSION_EVENTS_REQUEST',
}

/**
 * Type of analytics session request
 * @internal
 */
export type AnalyticsSessionRequestType = 'START' | 'STOP';

/**
 * Represents whether the event has been processed by the service
 * @internal
 */
export type EventStatus = 'PROCESSED' | 'UNPROCESSED';

/**
 * Supported analytic event types
 * @internal
 */
export type AnalyticEventKey = keyof DocumentEventMap;

/**
 * Index object of {@link AnalyticEventKey} to number
 * @internal
 */
export type AnalyticSessionEvents = { [key in AnalyticEventKey]?: number };

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
 * Data structure used as a base for sending requests to the TouchFree Service
 * @public
 */
export interface TouchFreeRequest {
    /** Request ID */
    requestID: string;
}

/**
 * Data structure used to send requests changing configuration or configuration files.
 *
 * @remarks
 * All properties are optional - configuration not included is not modified
 * @internal
 */
export class PartialConfigState implements TouchFreeRequest {
    /** Optional {@link InteractionConfig} */
    interaction: Partial<InteractionConfig> | null;
    /** Optional {@link PhysicalConfig} */
    physical: Partial<PhysicalConfig> | null;
    /** Request ID */
    requestID: string;

    constructor(id: string, interaction: Partial<InteractionConfig> | null, physical: Partial<PhysicalConfig> | null) {
        this.requestID = id;
        this.interaction = interaction;
        this.physical = physical;
    }
}

/**
 * Data structure for all TouchFree configuration
 * @public
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

/**
 * Data structure for {@link ActionCode.REQUEST_SERVICE_STATUS} and {@link ActionCode.SERVICE_STATUS} requests
 * @public
 */
export class ServiceStatus implements TouchFreeRequest {
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
 * @public
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
 * @public
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

/**
 * Outer container for {@link TrackingStateResponse} properties, including success state and a
 * message with property content
 * @public
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
 * Response data structure for {@link ActionCode.GET_TRACKING_STATE} and {@link ActionCode.SET_TRACKING_STATE} requests
 * @public
 */
// TODO: Don't expose internal types via this - use another type in public API
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
 * Represents a list of callbacks keyed against id strings
 * @internal
 */
export type CallbackList<T> = { [id: string]: TouchFreeRequestCallback<T> };
