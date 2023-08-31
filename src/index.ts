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
    AnalyticSessionEvents,
    getAnalyticSessionEvents,
    AnalyticEventKey,
    getRegisteredAnalyticEventKeys,
    registerAnalyticEvents,
    unregisterAnalyticEvents,
    StartAnalyticsSessionOptions,
    startAnalyticsSession,
    StopAnalyticsSessionOptions,
    stopAnalyticsSession,

    /** Configuration - Change configuration of the TouchFree Service */
    requestConfigChange,
    requestConfigState,
    requestConfigFileChange,
    requestConfigFileState,
    resetInteractionConfigFileToDefault,
    InteractionConfig,
    InteractionConfigFull,
    HoverAndHoldInteractionSettings,
    TouchPlaneInteractionSettings,
    PhysicalConfig,
    TouchFreeConfig,
    TrackedPosition,

    /** Connection - Manage a connection to the TouchFree service and messages send or receive messages */
    isConnected,
    connect,
    disconnect,
    getCurrentServiceAddress,
    getDefaultServiceAddress,
    requestServiceStatus,
    Address,
    ServiceState,
    TrackingServiceState,
    ConfigurationState,
    HandPresenceState,
    InteractionZoneState,
    ResponseState,
    ResponseCallback,

    /** Cursors - Multiple cursor styles/implementations and current cursor management */
    DotCursor,
    CursorPart,
    SVGCursor,
    TouchlessCursor,
    getCurrentCursor,
    setCurrentCursor,

    /** Initialization - Set up TouchFree tooling */
    TfInitParams,
    init,

    /** InputActions - Receive data about interactions */
    TouchFreeInputAction,
    HandChirality,
    HandType,
    InputType,
    InteractionType,
    InputActionManager,
    InputActionPlugin,

    /** Math types and functions */
    mapRangeToRange,
    Vector,
    Vector2,

    /** TouchFreeEvents - Access to events occurring within TouchFree */
    TouchFreeEventSignatures,
    TouchFreeEvent,
    EventHandle,
    registerEventCallback,
    dispatchEventCallback,

    /** Tracking - Control the Ultraleap Tracking Service via TouchFree Service */
    requestTrackingState,
    requestTrackingChange,
    Mask,
    TrackingState,
} from './internal/index';
