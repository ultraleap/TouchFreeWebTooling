import { InteractionConfigFull, InteractionConfig, PhysicalConfig } from '../Configuration/ConfigurationTypes';
import { ConfigurationState, TrackingServiceState } from '../TouchFreeToolingTypes';
import { Mask } from '../Tracking/TrackingTypes';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessageReceiver } from './MessageReceiver';

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

    constructor(_state: HandPresenceState) {
        this.state = _state;
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
export abstract class TouchFreeRequestCallback<T> {
    /** Timestamp the request was sent
     * @remarks
     * Typically used to clear request callbacks that exceed a timeout
     */
    timestamp: number;
    /** The callback the request should call */
    callback: (detail: T) => void;

    constructor(_timestamp: number, _callback: (detail: T) => void) {
        this.timestamp = _timestamp;
        this.callback = _callback;
    }
}

/**
 * Data structure used as a base for sending requests to the TouchFree Service
 * @virtual
 * @public
 */
export abstract class TouchFreeRequest {
    requestID: string;
    constructor(_requestID: string) {
        this.requestID = _requestID;
    }
}

/**
 * Data structure used to send requests changing configuration or configuration files.
 *
 * @remarks
 * All properties are optional - configuration not included is not modified
 * @internal
 */
export class PartialConfigState extends TouchFreeRequest {
    /** Optional {@link InteractionConfig} */
    interaction: Partial<InteractionConfig> | null;
    /** Optional {@link PhysicalConfig} */
    physical: Partial<PhysicalConfig> | null;

    constructor(
        _id: string,
        _interaction: Partial<InteractionConfig> | null,
        _physical: Partial<PhysicalConfig> | null
    ) {
        super(_id);
        this.interaction = _interaction;
        this.physical = _physical;
    }
}

/**
 * Data structure for all TouchFree configuration
 * @public
 */
export class ConfigState extends TouchFreeRequest {
    /** See {@link InteractionConfigFull} */
    interaction: InteractionConfigFull;
    /** See {@link PhysicalConfig} */
    physical: PhysicalConfig;

    constructor(_id: string, _interaction: InteractionConfigFull, _physical: PhysicalConfig) {
        super(_id);
        this.interaction = _interaction;
        this.physical = _physical;
    }
}

/**
 * Request type for {@link ActionCode.REQUEST_CONFIGURATION_STATE} and {@link ActionCode.REQUEST_CONFIGURATION_FILE}
 * @internal
 */
export class ConfigChangeRequest extends TouchFreeRequest {}

/**
 * Request callback type for receiving configuration state from the Service
 * @internal
 */
export class ConfigStateCallback extends TouchFreeRequestCallback<ConfigState> {}

/**
 * Request Service to reset the Interaction Config File to it's default state.
 * @internal
 */
export class ResetInteractionConfigFileRequest extends TouchFreeRequest {}

/**
 * Used to set the state of the Hand Render Data stream.
 * @internal
 */
export class HandRenderDataStateRequest extends TouchFreeRequest {
    /** Enabled */
    enabled: boolean;
    /** Lens */
    lens: string;

    constructor(_id: string, enabled: boolean, lens: string) {
        super(_id);
        this.enabled = enabled;
        this.lens = lens;
    }
}

/**
 * Data structure for {@link ActionCode.REQUEST_SERVICE_STATUS} and {@link ActionCode.SERVICE_STATUS} requests
 * @public
 */
export class ServiceStatus extends TouchFreeRequest {
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

    constructor(
        _id: string,
        _trackingServiceState: TrackingServiceState,
        _configurationState: ConfigurationState,
        _serviceVersion: string,
        _trackingVersion: string,
        _cameraSerial: string,
        _cameraFirmwareVersion: string
    ) {
        super(_id);
        this.trackingServiceState = _trackingServiceState;
        this.configurationState = _configurationState;
        this.serviceVersion = _serviceVersion;
        this.trackingVersion = _trackingVersion;
        this.cameraSerial = _cameraSerial;
        this.cameraFirmwareVersion = _cameraFirmwareVersion;
    }
}

/**
 * Request type for {@link ActionCode.SERVICE_STATUS}
 * @internal
 */
export class ServiceStatusRequest extends TouchFreeRequest {}

/**
 * Request callback type for receiving {@link ServiceStatus} from the service
 * via {@link ActionCode.SERVICE_STATUS_RESPONSE}
 * @internal
 */
export class ServiceStatusCallback extends TouchFreeRequestCallback<ServiceStatus> {}

/**
 * General purpose request response type
 * @public
 */
export class WebSocketResponse extends TouchFreeRequest {
    /** Response status */
    status: string;
    /** Message included with this response */
    message: string;
    /**
     * Original request this response is to, included for debugging purposes
     */
    originalRequest: string;

    constructor(_id: string, _status: string, _msg: string, _request: string) {
        super(_id);
        this.status = _status;
        this.message = _msg;
        this.originalRequest = _request;
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
        _id: string,
        _status: string,
        _msg: string,
        _request: string,
        _touchFreeVersion: string,
        _apiVersion: string
    ) {
        super(_id, _status, _msg, _request);
        this.touchFreeVersion = _touchFreeVersion;
        this.apiVersion = _apiVersion;
    }
}

/**
 * General purpose request callback type
 * @remarks
 * Responses can represent success or failure. See {@link WebSocketResponse.status}.
 * Detailed message is available in {@link WebSocketResponse.message}.
 * @internal
 */
export class ResponseCallback extends TouchFreeRequestCallback<WebSocketResponse> {}

/**
 * Container used to wrap request data structures with an {@link ActionCode}
 * @internal
 */
export class CommunicationWrapper<T> {
    /** See {@link ActionCode} */
    action: ActionCode;
    /** Wrapped content */
    content: T;

    constructor(_actionCode: ActionCode, _content: T) {
        this.action = _actionCode;
        this.content = _content;
    }
}

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
 * Response data structure for {@link ActionCode.GET_TRACKING_STATE} and {@link ActionCode.SET_TRACKING_STATE} requests
 * @public
 */
// TODO: Don't expose internal types via this - use another type in public API
export interface TrackingStateResponse {
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
export class TrackingStateRequest {
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

    constructor(_id: string, _mask: Mask, _cameraReversed: boolean, _allowImages: boolean, _analyticsEnabled: boolean) {
        this.requestID = _id;
        this.mask = _mask;
        this.cameraReversed = _cameraReversed;
        this.allowImages = _allowImages;
        this.analyticsEnabled = _analyticsEnabled;
    }
}

/**
 * Basic request data structure
 * @remarks
 * Typically used with {@link CommunicationWrapper} to create more complex requests
 * @internal
 */
export class SimpleRequest {
    /** Request ID */
    requestID: string;

    constructor(_id: string) {
        this.requestID = _id;
    }
}

/**
 * Represents the base information needed for an Analytics related request to the Service
 * @internal
 */
interface BaseAnalyticsRequest {
    /** Request ID */
    requestID: string;
    /** Session ID */
    sessionID: string;
}

/**
 * Represents a request to the service to change the state of an analytics session
 * @internal
 */
export interface AnalyticsSessionStateChangeRequest extends BaseAnalyticsRequest {
    /** See {@link AnalyticsSessionRequestType} */
    requestType: AnalyticsSessionRequestType;
}

/**
 * Represents a request to the service to update the event counts in the current analytics session
 * @internal
 */
export interface UpdateAnalyticSessionEventsRequest extends BaseAnalyticsRequest {
    /** See {@link AnalyticSessionEvents} */
    sessionEvents: AnalyticSessionEvents;
}

/**
 * Request callback type for receiving {@link TrackingStateResponse} requests via {@link ActionCode.TRACKING_STATE}
 * @internal
 */
export class TrackingStateCallback {
    /** Timestamp */
    timestamp: number;
    /** Callback */
    callback: (detail: TrackingStateResponse) => void;

    constructor(_timestamp: number, _callback: (detail: TrackingStateResponse) => void) {
        this.timestamp = _timestamp;
        this.callback = _callback;
    }
}

/**
 * Represents a list of callbacks keyed against id strings
 * @internal
 */
export type CallbackList<T> = { [id: string]: TouchFreeRequestCallback<T> };
