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
