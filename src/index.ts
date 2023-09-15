/**
 * @packageDocumentation
 * TouchFree is an ecosystem of software products for enabling
 * touchless interfaces. This package is a client package
 * for integrating TouchFree into web application.
 * See https://docs.ultraleap.com/touchfree-user-manual/
 */

/**
 * This file exports the public API surface of the library.
 * Internals should not be leaked from this export, if any
 * internals are required then explicit usage of the internal
 * module is recommended.
 */

export {
    /** Analytics - Record analytics data while running */
    isAnalyticsActive,
    getRegisteredAnalyticEventKeys,
    registerAnalyticEvents,
    unregisterAnalyticEvents,
    startAnalyticsSession,
    stopAnalyticsSession,

    /** Configuration - Change configuration of the TouchFree Service */
    requestConfigChange,
    requestConfigState,
    requestConfigFileChange,
    requestConfigFileState,
    resetInteractionConfigFileToDefault,
    TrackedPosition,

    /** Connection - Manage a connection to the TouchFree service and messages send or receive messages */
    isConnected,
    connect,
    disconnect,
    getCurrentServiceAddress,
    getDefaultServiceAddress,
    requestServiceStatus,
    TrackingServiceState,
    ConfigurationState,
    HandPresenceState,
    InteractionZoneState,

    /** Cursors - Multiple cursor styles/implementations and current cursor management */
    DotCursor,
    CursorPart,
    SVGCursor,
    TouchlessCursor,
    getCurrentCursor,
    setCurrentCursor,

    /** Initialization - Set up TouchFree tooling */
    init,

    /** InputActions - Receive data about interactions */
    HandChirality,
    HandType,
    InputType,
    InteractionType,

    /** Math types and functions */
    mapRangeToRange,

    /** TouchFreeEvents - Access to events occurring within TouchFree */
    registerEventCallback,
    dispatchEventCallback,
} from './internal/index';


export type {
    /** Analytics - Record analytics data while running */
    AnalyticEventKey,
    StartAnalyticsSessionOptions,
    StopAnalyticsSessionOptions,

    /** Configuration - Change configuration of the TouchFree Service */
    DeepPartial,
    InteractionConfig,
    HoverAndHoldInteractionSettings,
    TouchPlaneInteractionSettings,
    PhysicalConfig,
    TouchFreeConfig,

    /** Connection - Manage a connection to the TouchFree service and messages send or receive messages */
    Address,
    ServiceState,
    ResponseState,
    ResponseCallback,

    /** Initialization - Set up TouchFree tooling */
    TfInitParams,

    /** InputActions - Receive data about interactions */
    TouchFreeInputAction,

    /** Math types and functions */
    Vector,
    Vector2,

    /** TouchFreeEvents - Access to events occurring within TouchFree */
    TouchFreeEventSignatures,
    TouchFreeEvent,
    TouchFreeEventHandle,
} from './internal/index';