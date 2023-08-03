import { LicenseState } from 'Licensing/Licensing';
import { InteractionConfigFull, InteractionConfig, PhysicalConfig } from '../Configuration/ConfigurationTypes';
import { ConfigurationState, TrackingServiceState } from '../TouchFreeToolingTypes';
import { Mask } from '../Tracking/TrackingTypes';

// Enum: ActionCode
// INPUT_ACTION - Represents standard interaction data
// CONFIGURATION_STATE - Represents a collection of configurations from the Service
// CONFIGURATION_RESPONSE - Represents a Success/Failure response from a SET_CONFIGURATION_STATE
// SET_CONFIGURATION_STATE - Represents a request to set new configuration files on the Service
// REQUEST_CONFIGURATION_STATE - Represents a request to receive a current CONFIGURATION_STATE from the Service
// VERSION_HANDSHAKE - Represents an outgoing message from Tooling to Service,
//                     attempting to compare API versions for compatibility
// HAND_PRESENCE_EVENT - Represents the result coming in from the Service
// REQUEST_SERVICE_STATUS - Represents a request to receive a current SERVICE_STATUS from the Service
// SERVICE_STATUS_RESPONSE - Represents a Failure response from a REQUEST_SERVICE_STATUS
// SERVICE_STATUS - Represents information about the current state of the Service
// QUICK_SETUP - Represents a request for performing a quick setup of the Service
// QUICK_SETUP_CONFIG - Represents a response from the Service after a QUICK_SETUP request
//                      where the configuration was updated as the quick setup was successfully completed.
// QUICK_SETUP_RESPONSE - Represents a response from the Service after a QUICK_SETUP request
//                        where the configuration was not updated.
// GET_TRACKING_STATE - Represents a request to receive the current state of the tracking settings
// SET_TRACKING_STATE - Represents a request to set the current state of the tracking settings
// TRACKING_STATE - Represents a response from the Service with the current state of the tracking settings,
//                  received following either a GET_TRACKING_STATE or a SET_TRACKING_STATE
// HAND_DATA - Represents more complete hand data sent from the service.
// SET_HAND_DATA_STREAM_STATE - Represents a request to the Service to enable/disable
//                              the HAND_DATA stream or change the lens to have the hand position relative to.
// INTERACTION_ZONE_EVENT - Represents the interaction zone state received from the Service
// ANALYTICS_SESSION_REQUEST - Represents a request to start or stop an analytics session
// ANALYTICS_UPDATE_SESSION_EVENTS_REQUEST - Represents a request to update the analytic events for the current session.
// GET_LICENSE_STATE - Represents a request to receive current Licensing state of TouchFree Service
// LICENSE_STATE_RESPONSE - Represents a response to a request for the current Licensing state of
//                          TouchFree Service
// ADD_LICENSE_KEY - Represents a request to add a License Key to TouchFree Service
// ADD_LICENSE_RESPONSE - Represents a response to an add License Key request
// REMOVE_LICENSE_KEY - Represents a request to remove a License Key to TouchFree Service
// REMOVE_LICENSE_RESPONSE - Represents a response to an remove License Key request
// LICENSE_STATE - Represents an event emitted by the Service whenever TouchFree's Licensing Service changes
//
export enum ActionCode {
    INPUT_ACTION = 'INPUT_ACTION',

    CONFIGURATION_STATE = 'CONFIGURATION_STATE',
    CONFIGURATION_RESPONSE = 'CONFIGURATION_RESPONSE',
    SET_CONFIGURATION_STATE = 'SET_CONFIGURATION_STATE',
    REQUEST_CONFIGURATION_STATE = 'REQUEST_CONFIGURATION_STATE',

    VERSION_HANDSHAKE = 'VERSION_HANDSHAKE',
    VERSION_HANDSHAKE_RESPONSE = 'VERSION_HANDSHAKE_RESPONSE',

    HAND_PRESENCE_EVENT = 'HAND_PRESENCE_EVENT',

    REQUEST_SERVICE_STATUS = 'REQUEST_SERVICE_STATUS',
    SERVICE_STATUS_RESPONSE = 'SERVICE_STATUS_RESPONSE',
    SERVICE_STATUS = 'SERVICE_STATUS',

    REQUEST_CONFIGURATION_FILE = 'REQUEST_CONFIGURATION_FILE',
    CONFIGURATION_FILE_STATE = 'CONFIGURATION_FILE_STATE',
    SET_CONFIGURATION_FILE = 'SET_CONFIGURATION_FILE',
    CONFIGURATION_FILE_CHANGE_RESPONSE = 'CONFIGURATION_FILE_CHANGE_RESPONSE',

    QUICK_SETUP = 'QUICK_SETUP',
    QUICK_SETUP_CONFIG = 'QUICK_SETUP_CONFIG',
    QUICK_SETUP_RESPONSE = 'QUICK_SETUP_RESPONSE',

    GET_TRACKING_STATE = 'GET_TRACKING_STATE',
    SET_TRACKING_STATE = 'SET_TRACKING_STATE',
    TRACKING_STATE = 'TRACKING_STATE',

    HAND_DATA = 'HAND_DATA',
    SET_HAND_DATA_STREAM_STATE = 'SET_HAND_DATA_STREAM_STATE',

    INTERACTION_ZONE_EVENT = 'INTERACTION_ZONE_EVENT',

    RESET_INTERACTION_CONFIG_FILE = 'RESET_INTERACTION_CONFIG_FILE',

    ANALYTICS_SESSION_REQUEST = 'ANALYTICS_SESSION_REQUEST',
    ANALYTICS_UPDATE_SESSION_EVENTS_REQUEST = 'ANALYTICS_UPDATE_SESSION_EVENTS_REQUEST',

    GET_LICENSE_STATE = 'GET_LICENSE_STATE',
    LICENSE_STATE_RESPONSE = 'LICENSE_STATE_RESPONSE',
    ADD_LICENSE_KEY = 'ADD_LICENSE_KEY',
    ADD_LICENSE_RESPONSE = 'ADD_LICENSE_RESPONSE',
    REMOVE_LICENSE_KEY = 'REMOVE_LICENSE_KEY',
    REMOVE_LICENSE_RESPONSE = 'REMOVE_LICENSE_RESPONSE',
    LICENSE_STATE = 'LICENSE_STATE',
}

// Type: RequestSessionStateChange
// START - Sent to the service to start an analytics session
// STOP - Sent to the service to stop an analytics session
export type AnalyticsSessionRequestType = 'START' | 'STOP';

// Type: EventStatus
// Represents whether the event has been processed by the service
export type EventStatus = 'PROCESSED' | 'UNPROCESSED';

// Type: AnalyticEventKey
// Supported analytic event types
export type AnalyticEventKey = keyof DocumentEventMap;

// Type: AnalyticSessionEvents
// Indexed object storing how many times each analytics event has been triggered
export type AnalyticSessionEvents = { [key in AnalyticEventKey]?: number };

// Enum: HandPresenceState
// HAND_FOUND - Sent when the first hand is found when no hand has been present for a moment
// HANDS_LOST - Sent when the last observed hand is lost, meaning no more hands are observed
// PROCESSED - Used locally to indicate that no change in state is awaiting processing. See its
//             use in <MessageReceiver> for more details.
export enum HandPresenceState {
    HAND_FOUND,
    HANDS_LOST,
    PROCESSED,
}

// Enum: InteractionZoneState
// HAND_ENTERED - Sent when the "active" hand enters the interaction zone
// HAND_EXITED - Sent when the "active" hand leaves the interaction zone
export enum InteractionZoneState {
    HAND_ENTERED,
    HAND_EXITED,
}

// Class: EventUpdate
// Generic interface for handling events from the service.
// status - indicates whether the event has been processed by the service
// state - the received state from the event
export interface EventUpdate<T> {
    // Variable: status
    status: EventStatus;
    // Variable: state
    state: T;
}

// Enum: Compatibility
// COMPATIBLE - The API versions are considered compatible
// SERVICE_OUTDATED - The API versions are considered incompatible as Service is older than Tooling
// TOOLING_OUTDATED - The API versions are considered incompatible as Tooling is older than Service
export enum Compatibility {
    COMPATIBLE,
    SERVICE_OUTDATED,
    TOOLING_OUTDATED,
}

// Class: HandPresenceEvent
// This data structure is used to receive hand presence requests
export class HandPresenceEvent {
    state: HandPresenceState;

    constructor(_state: HandPresenceState) {
        this.state = _state;
    }
}

// Class: InteractionZoneEvent
// This data structure is used to receive interaction zone requests
export interface InteractionZoneEvent {
    state: InteractionZoneState;
}

// Class: TouchFreeRequestCallback
// This data structure is used to hold request callbacks
export abstract class TouchFreeRequestCallback<T> {
    // Variable: timestamp
    timestamp: number;
    // Variable: callback
    callback: (detail: T) => void;

    constructor(_timestamp: number, _callback: (detail: T) => void) {
        this.timestamp = _timestamp;
        this.callback = _callback;
    }
}

// Class: TouchFreeRequest
// This data structure is used as a base for requests to the TouchFree service.
export abstract class TouchFreeRequest {
    requestID: string;
    constructor(_requestID: string) {
        this.requestID = _requestID;
    }
}

// Class: PartialConfigState
// This data structure is used to send requests for changes to configuration or to configuration files.
//
// When sending a configuration to the Service the structure can be comprised of either partial or complete objects.
export class PartialConfigState extends TouchFreeRequest {
    // Variable: interaction
    interaction: Partial<InteractionConfig> | null;
    // Variable: physical
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

// Class: ConfigState
// This data structure is used when receiving configuration data representing the state of the service
// or its config files.
//
// When receiving a configuration from the Service this structure contains ALL configuration data
export class ConfigState extends TouchFreeRequest {
    // Variable: interaction
    interaction: InteractionConfigFull;
    // Variable: physical
    physical: PhysicalConfig;

    constructor(_id: string, _interaction: InteractionConfigFull, _physical: PhysicalConfig) {
        super(_id);
        this.interaction = _interaction;
        this.physical = _physical;
    }
}

// class: ConfigChangeRequest
// Used to request the current state of the configuration on the Service. This is received as
// a <ConfigState> which should be linked to a <ConfigStateCallback> via requestID to make
// use of the data received.
export class ConfigChangeRequest extends TouchFreeRequest {}

// Class: ConfigStateCallback
// Used by <MessageReceiver> to wait for a <ConfigState> from the Service. Owns a callback
// with a <ConfigState> as a parameter to allow users to make use of the new
// <ConfigStateResponse>. Stores a timestamp of its creation so the response has the ability to
// timeout if not seen within a reasonable timeframe.
export class ConfigStateCallback extends TouchFreeRequestCallback<ConfigState> {}

// class: ResetInteractionConfigFile
// Used internally to request that the Service resets the Interaction Config File to
// its default state. Provides the Default <InteractionConfigFull> returned by the Service
// once the reset is complete.
export class ResetInteractionConfigFileRequest extends TouchFreeRequest {}

// class: HandRenderDataStateRequest
// Used to set the state of the Hand Render Data stream.
export class HandRenderDataStateRequest extends TouchFreeRequest {
    // Variable: enabled
    enabled: boolean;
    // Variable: lens
    lens: string;

    constructor(_id: string, enabled: boolean, lens: string) {
        super(_id);
        this.enabled = enabled;
        this.lens = lens;
    }
}

// Class: ServiceStatus
// This data structure is used to receive service status.
//
// When receiving a configuration from the Service this structure contains ALL status data
export class ServiceStatus extends TouchFreeRequest {
    // Variable: trackingServiceState
    trackingServiceState: TrackingServiceState;
    // Variable: configurationState
    configurationState: ConfigurationState;
    // Variable: serviceVersion
    serviceVersion: string;
    // Variable: trackingVersion
    trackingVersion: string;
    // Variable: cameraSerial
    cameraSerial: string;
    // Variable: cameraFirmwareVersion
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

// class: ServiceStatusRequest
// Used to request the current state of the status of the Service. This is received as
// a <ServiceStatus> which should be linked to a <ServiceStatusCallback> via requestID to make
// use of the data received.
export class ServiceStatusRequest extends TouchFreeRequest {}

// Class: ServiceStatusCallback
// Used by <MessageReceiver> to wait for a <ServiceStatus> from the Service. Owns a callback
// with a <ServiceStatus> as a parameter to allow users to make use of the new
// <ServiceStatusResponse>. Stores a timestamp of its creation so the response has the ability to
// timeout if not seen within a reasonable timeframe.
export class ServiceStatusCallback extends TouchFreeRequestCallback<ServiceStatus> {}

// class: LicenseStatusRequest
// Used to request the current Licensing state of the Service. This is recieved as a <LicenseState>
// which should be linked to a <LicenseStateCallback> via its requestID to to make use of the
// response.
export class LicenseStatusRequest extends TouchFreeRequest {}

// Class: LicenseStateResponse
// The structure seen when the Service responds to a <LicenseStatusRequest>. Contains a
// <LicenseState> representing the current state of Service's Licenses.
export class LicenseStateResponse extends TouchFreeRequest {
    public licenseState: LicenseState;

    constructor(_requestID: string, _state: LicenseState) {
        super(_requestID);
        this.licenseState = _state;
    }
}

// Class: LicenseStateCallback
// Used by <MessageReceiver> to wait for a <LicenseState> from the Service. Owns a callback with a
// <LicenseState> as a parameter to allow users to make use of the <LicenseStateResponse>
export class LicenseStateCallback extends TouchFreeRequestCallback<LicenseStateResponse> {}

// Class: LicenseKeyRequest
// Used to request the addition / removal of License Keys from TouchFree. A <LicenseChangeResponse>
// should follow from the Service, which should be connected to this via request via its requestID.
export class LicenseKeyRequest extends TouchFreeRequest {
    public licenseKey: string;

    constructor(_requestID: string, _licenseKey: string) {
        super(_requestID);
        this.licenseKey = _licenseKey;
    }
}

// Class: LicenseChangeResponse
// The response to a request to modify (add/remove) a License Key in TouchFree Service. Contains
// a boolean representing whether the modification was successful, and a <changeDetails> string
// containing a message detailing any relevant info, for displaying to users.
export class LicenseChangeResponse extends TouchFreeRequest {
    public changeDetails: string;
    public succeeded: boolean;

    constructor(_requestID: string, _changeDetails: string, _succeeded: boolean) {
        super(_requestID);
        this.changeDetails = _changeDetails;
        this.succeeded = _succeeded;
    }
}

// Class: LicenseChangeCallback
// Used by <MessageReceiver> to wait for a <LicenseChangeResponse> from the Service. Owns a callback
// function which takes a <LicenseChangeResponse> as a parameter to allow users to make use of the
// details of the response.
export class LicenseChangeCallback extends TouchFreeRequestCallback<LicenseChangeResponse> {}

// Class: WebSocketResponse
// The structure seen when the Service responds to a request. This is to verify whether it was
// successful or not and will include the original request if it fails, to allow for
// troubleshooting.
export class WebSocketResponse extends TouchFreeRequest {
    // Variable: status
    status: string;
    // Variable: message
    message: string;
    // Variable: originalRequest
    originalRequest: string;

    constructor(_id: string, _status: string, _msg: string, _request: string) {
        super(_id);
        this.status = _status;
        this.message = _msg;
        this.originalRequest = _request;
    }
}

// Class: VersionHandshakeResponse
// The structure seen when the Service responds to a Version Handshake request.
export class VersionHandshakeResponse extends WebSocketResponse {
    // Variable: touchFreeVersion
    touchFreeVersion: string;
    // Variable: message
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

// Class: ResponseCallback
// Used by <MessageReceiver> to wait for a <WebSocketResponse> from the Service. Owns a callback
// with a <WebSocketResponse> as a parameter to allow users to deal with failed
// <WebSocketResponses>. Stores a timestamp of its creation so the response has the ability to
// timeout if not seen within a reasonable timeframe.
export class ResponseCallback extends TouchFreeRequestCallback<WebSocketResponse> {}

// Class: CommunicationWrapper
// A container structure used by <ServiceConnection> to interpret incoming data to its appropriate
// subtypes based on the <action> and pass the <content> on to the appropriate handler.
export class CommunicationWrapper<T> {
    // Variable: action
    action: ActionCode;
    // Variable: content
    content: T;

    constructor(_actionCode: ActionCode, _content: T) {
        this.action = _actionCode;
        this.content = _content;
    }
}

// Class: SuccessWrapper
// Type extension for <TrackingStateResponse> to capture the success state, clarifying message and response content.
export interface SuccessWrapper<T> {
    // Variable: succeeded
    succeeded: boolean;
    // Variable: msg
    msg: string;
    // Variable: content
    content?: T;
}

// Class: TrackingStateResponse
// Type of the response from a GET/SET tracking state request.
export interface TrackingStateResponse {
    // Variable: requestID
    requestID: string;
    // Variable: mask
    mask: SuccessWrapper<Mask> | null;
    // Variable: cameraOrientation
    cameraReversed: SuccessWrapper<boolean> | null;
    // Variable: allowImages
    allowImages: SuccessWrapper<boolean> | null;
    // Variable: analyticsEnabled
    analyticsEnabled: SuccessWrapper<boolean> | null;
}

// Class: TrackingStateRequest
// Used to construct a SET_TRACKING_STATE request.
export class TrackingStateRequest {
    // Variable: requestID
    requestID: string;
    // Variable: mask
    mask: Mask;
    // Variable: cameraOrientation
    cameraReversed: boolean;
    // Variable: allowImages
    allowImages: boolean;
    // Variable: analyticsEnabled
    analyticsEnabled: boolean;

    constructor(_id: string, _mask: Mask, _cameraReversed: boolean, _allowImages: boolean, _analyticsEnabled: boolean) {
        this.requestID = _id;
        this.mask = _mask;
        this.cameraReversed = _cameraReversed;
        this.allowImages = _allowImages;
        this.analyticsEnabled = _analyticsEnabled;
    }
}

// Class: SimpleRequest
// Used to make a basic request to the service. To be used with <CommunicationWrapper> to create a more complex request.
export class SimpleRequest {
    // Variable: requestID
    requestID: string;

    constructor(_id: string) {
        this.requestID = _id;
    }
}

// Interface BaseAnalyticsRequest
// Represents the base information needed for an Analytics related request to the Service
interface BaseAnalyticsRequest {
    // Variable: requestID
    requestID: string;
    // Variable: sessionID
    sessionID: string;
}

// Interface: AnalyticsSessionStateChangeRequest
// Represents a request to the service to change the state of an analytics session.
export interface AnalyticsSessionStateChangeRequest extends BaseAnalyticsRequest {
    // Variable: state
    requestType: AnalyticsSessionRequestType;
}

// Interface: UpdateAnalyticSessionEventsRequest
// Represents a request to the service to update the event counts in the current analytics session.
export interface UpdateAnalyticSessionEventsRequest extends BaseAnalyticsRequest {
    // Variable: eventCounts
    sessionEvents: AnalyticSessionEvents;
}

// Class: TrackingStateCallback
// Used by <MessageReceiver> to wait for a <TrackingStateResponse> from the Service. Owns a callback with a
// <TrackingStateResponse> as a parameter. Stores a timestamp of its creation so the response has the ability to
// timeout if not seen within a reasonable timeframe.
export class TrackingStateCallback {
    // Variable: timestamp
    timestamp: number;
    // Variable: callback
    callback: (detail: TrackingStateResponse) => void;

    constructor(_timestamp: number, _callback: (detail: TrackingStateResponse) => void) {
        this.timestamp = _timestamp;
        this.callback = _callback;
    }
}

// Type: CallbackList
// Represents a list of callbacks keyed against id strings.
export type CallbackList<T> = { [id: string]: TouchFreeRequestCallback<T> };
