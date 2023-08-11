## API Report File for "touchfree"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

// @internal
enum ActionCode {
    ANALYTICS_SESSION_REQUEST = "ANALYTICS_SESSION_REQUEST",
    ANALYTICS_UPDATE_SESSION_EVENTS_REQUEST = "ANALYTICS_UPDATE_SESSION_EVENTS_REQUEST",
    CONFIGURATION_FILE_CHANGE_RESPONSE = "CONFIGURATION_FILE_CHANGE_RESPONSE",
    // @deprecated
    CONFIGURATION_FILE_RESPONSE = "CONFIGURATION_FILE_RESPONSE",
    CONFIGURATION_FILE_STATE = "CONFIGURATION_FILE_STATE",
    CONFIGURATION_RESPONSE = "CONFIGURATION_RESPONSE",
    CONFIGURATION_STATE = "CONFIGURATION_STATE",
    GET_TRACKING_STATE = "GET_TRACKING_STATE",
    HAND_DATA = "HAND_DATA",
    HAND_PRESENCE_EVENT = "HAND_PRESENCE_EVENT",
    INPUT_ACTION = "INPUT_ACTION",
    INTERACTION_ZONE_EVENT = "INTERACTION_ZONE_EVENT",
    QUICK_SETUP = "QUICK_SETUP",
    QUICK_SETUP_CONFIG = "QUICK_SETUP_CONFIG",
    QUICK_SETUP_RESPONSE = "QUICK_SETUP_RESPONSE",
    REQUEST_CONFIGURATION_FILE = "REQUEST_CONFIGURATION_FILE",
    REQUEST_CONFIGURATION_STATE = "REQUEST_CONFIGURATION_STATE",
    REQUEST_SERVICE_STATUS = "REQUEST_SERVICE_STATUS",
    RESET_INTERACTION_CONFIG_FILE = "RESET_INTERACTION_CONFIG_FILE",
    SERVICE_STATUS = "SERVICE_STATUS",
    SERVICE_STATUS_RESPONSE = "SERVICE_STATUS_RESPONSE",
    SET_CONFIGURATION_FILE = "SET_CONFIGURATION_FILE",
    SET_CONFIGURATION_STATE = "SET_CONFIGURATION_STATE",
    SET_HAND_DATA_STREAM_STATE = "SET_HAND_DATA_STREAM_STATE",
    SET_TRACKING_STATE = "SET_TRACKING_STATE",
    TRACKING_STATE = "TRACKING_STATE",
    VERSION_HANDSHAKE = "VERSION_HANDSHAKE",
    VERSION_HANDSHAKE_RESPONSE = "VERSION_HANDSHAKE_RESPONSE"
}

// @internal
type AnalyticEventKey = keyof DocumentEventMap;

// @internal
type AnalyticSessionEvents = {
    [key in AnalyticEventKey]?: number;
};

// @internal
type AnalyticsSessionRequestType = 'START' | 'STOP';

// Warning: (ae-forgotten-export) The symbol "BaseAnalyticsRequest" needs to be exported by the entry point index.d.ts
//
// @internal
interface AnalyticsSessionStateChangeRequest extends BaseAnalyticsRequest {
    requestType: AnalyticsSessionRequestType;
}

// @public
abstract class BaseInputController {
    constructor();
    disconnect(): void;
    protected HandleInputAction(_inputData: TouchFreeInputAction): void;
}

// @internal
export enum BitmaskFlags {
    CANCEL = 32,
    DOWN = 64,
    GRAB = 512,
    HOVER = 1024,
    LEFT = 1,
    MOVE = 128,
    NONE = 0,
    NONE_INPUT = 16,
    PRIMARY = 4,
    PUSH = 2048,
    RIGHT = 2,
    SECONDARY = 8,
    TOUCHPLANE = 4096,
    UP = 256,
    VELOCITYSWIPE = 8192
}

// @internal
type CallbackList<T> = {
    [id: string]: TouchFreeRequestCallback<T>;
};

// @internal
class CommunicationWrapper<T> {
    constructor(_actionCode: ActionCode, _content: T);
    action: ActionCode;
    content: T;
}

// @internal @deprecated
enum Compatibility {
    COMPATIBLE = 0,
    SERVICE_OUTDATED = 1,
    TOOLING_OUTDATED = 2
}

// @internal
class ConfigChangeRequest extends TouchFreeRequest {
}

// @public
class ConfigState extends TouchFreeRequest {
    constructor(_id: string, _interaction: InteractionConfigFull, _physical: PhysicalConfig);
    interaction: InteractionConfigFull;
    physical: PhysicalConfig;
}

// @internal
class ConfigStateCallback extends TouchFreeRequestCallback<ConfigState> {
}

declare namespace Configuration {
    export {
        ConfigurationManager,
        InteractionConfig,
        InteractionConfigFull,
        HoverAndHoldInteractionSettings,
        TouchPlaneInteractionSettings,
        VelocitySwipeSettings,
        PhysicalConfig,
        Vector,
        Vector2,
        TrackedPosition
    }
}
export { Configuration }

// @public
class ConfigurationManager {
    static RequestConfigChange(_interaction: Partial<InteractionConfig> | null, _physical: Partial<PhysicalConfig> | null, _callback: (detail: WebSocketResponse) => void): void;
    static RequestConfigFileChange(_interaction: Partial<InteractionConfig> | null, _physical: Partial<PhysicalConfig> | null, _callback: (detail: WebSocketResponse) => void | null): void;
    static RequestConfigFileState(_callback: (detail: ConfigState) => void): void;
    static RequestConfigState(_callback: (detail: ConfigState) => void): void;
    static ResetInteractionConfigFileToDefault(_callback: (newState: ConfigState) => void): void;
}

// @public
export enum ConfigurationState {
    ERRORED = 2,
    LOADED = 1,
    NOT_LOADED = 0
}

declare namespace Connection {
    export {
        ConnectionManager,
        MessageReceiver,
        ServiceConnection,
        ActionCode,
        AnalyticsSessionRequestType,
        EventStatus,
        AnalyticEventKey,
        AnalyticSessionEvents,
        HandPresenceState,
        InteractionZoneState,
        EventUpdate,
        Compatibility,
        HandPresenceEvent,
        InteractionZoneEvent,
        TouchFreeRequestCallback,
        TouchFreeRequest,
        PartialConfigState,
        ConfigState,
        ConfigChangeRequest,
        ConfigStateCallback,
        ResetInteractionConfigFileRequest,
        HandRenderDataStateRequest,
        ServiceStatus,
        ServiceStatusRequest,
        ServiceStatusCallback,
        WebSocketResponse,
        VersionHandshakeResponse,
        ResponseCallback,
        CommunicationWrapper,
        SuccessWrapper,
        TrackingStateResponse,
        TrackingStateRequest,
        SimpleRequest,
        AnalyticsSessionStateChangeRequest,
        UpdateAnalyticSessionEventsRequest,
        TrackingStateCallback,
        CallbackList
    }
}
export { Connection }

// @public
class ConnectionManager extends EventTarget {
    // @deprecated
    static AddConnectionListener(_onConnectFunc: () => void): void;
    // @deprecated
    static AddServiceStatusListener(_serviceStatusFunc: (serviceStatus: TrackingServiceState) => void): void;
    static Connect(): void;
    static Disconnect(): void;
    static GetCurrentHandPresence(): HandPresenceState;
    static GetCurrentInteractionZoneState(): InteractionZoneState;
    static HandleHandPresenceEvent(_state: HandPresenceState): void;
    static HandleInteractionZoneEvent(_state: InteractionZoneState): void;
    // Warning: (ae-forgotten-export) The symbol "InitParams" needs to be exported by the entry point index.d.ts
    static init(initParams?: InitParams): void;
    static instance: ConnectionManager;
    static iPAddress: string;
    static get IsConnected(): boolean;
    // @internal
    static messageReceiver: MessageReceiver;
    static port: string;
    static RequestServiceStatus(_callback: (detail: ServiceStatus) => void): void;
    // @internal
    static serviceConnection(): ServiceConnection | null;
    // Warning: (ae-forgotten-export) The symbol "Address" needs to be exported by the entry point index.d.ts
    static SetAddress(address: Address): void;
}

// @internal
export function ConvertInputAction(_wsInput: WebsocketInputAction): TouchFreeInputAction;

declare namespace Cursors {
    export {
        DotCursor,
        SVGCursor,
        TouchlessCursor
    }
}
export { Cursors }

// @public
export const DispatchEvent: <TEvent extends TouchFreeEvent>(eventType: TEvent, ...args: Parameters<TouchFreeEventSignatures[TEvent]>) => void;

// @public
class DotCursor extends TouchlessCursor {
    constructor(cursor: HTMLElement, cursorRing: HTMLElement, animationDuration?: number, ringSizeMultiplier?: number);
    readonly animationUpdateDuration: number;
    cursorRing: HTMLElement;
    // @internal
    GrowCursor(): void;
    // @internal
    protected HandleInputAction(inputData: TouchFreeInputAction): void;
    HideCursor(): void;
    ringSizeMultiplier: number;
    ShowCursor(): void;
    // @internal
    ShrinkCursor(): void;
    // @internal
    protected UpdateCursor(inputAction: TouchFreeInputAction): void;
}

// @public
export interface EventHandle {
    UnregisterEventCallback(): void;
}

// @internal
type EventStatus = 'PROCESSED' | 'UNPROCESSED';

// @internal
interface EventUpdate<T> {
    state: T;
    status: EventStatus;
}

// @internal
export enum FingerType {
    TYPE_INDEX = 1,
    TYPE_MIDDLE = 2,
    TYPE_PINKY = 4,
    TYPE_RING = 3,
    TYPE_THUMB = 0,
    TYPE_UNKNOWN = -1
}

// @internal
export class FlagUtilities {
    static GetChiralityFromFlags(_flags: BitmaskFlags): HandChirality;
    static GetHandTypeFromFlags(_flags: BitmaskFlags): HandType;
    static GetInputTypeFromFlags(_flags: BitmaskFlags): InputType;
    static GetInteractionFlags(_interactionType: InteractionType, _handType: HandType, _chirality: HandChirality, _inputType: InputType): BitmaskFlags;
    static GetInteractionTypeFromFlags(_flags: BitmaskFlags): InteractionType;
}

// @public
export enum HandChirality {
    LEFT = 0,
    RIGHT = 1
}

// @internal
export class HandFrame {
    Hands: RawHand[];
}

// @internal
class HandPresenceEvent {
    constructor(_state: HandPresenceState);
    state: HandPresenceState;
}

// @public
enum HandPresenceState {
    HAND_FOUND = 0,
    HANDS_LOST = 1,
    // @internal
    PROCESSED = 2
}

// @internal
class HandRenderDataStateRequest extends TouchFreeRequest {
    constructor(_id: string, enabled: boolean, lens: string);
    enabled: boolean;
    lens: string;
}

// @public
export enum HandType {
    PRIMARY = 0,
    SECONDARY = 1
}

// @public
interface HoverAndHoldInteractionSettings {
    HoverCompleteTimeS: number;
    HoverStartTimeS: number;
}

// @public
class InputActionManager extends EventTarget {
    // @internal
    static HandleInputAction(_action: TouchFreeInputAction): void;
    static get instance(): InputActionManager;
    static _instance: InputActionManager;
    static plugins: Array<InputActionPlugin> | null;
    static SetPlugins(_plugins: Array<InputActionPlugin>): void;
}

// @public
abstract class InputActionPlugin extends EventTarget {
    // @internal
    ModifyInputAction(_inputAction: TouchFreeInputAction): TouchFreeInputAction | null;
    RunPlugin(_inputAction: TouchFreeInputAction): TouchFreeInputAction | null;
    // @internal
    TransmitInputAction(_inputAction: TouchFreeInputAction): void;
}

declare namespace InputControllers {
    export {
        BaseInputController,
        WebInputController
    }
}
export { InputControllers }

// @public
export enum InputType {
    CANCEL = 1,
    DOWN = 2,
    MOVE = 3,
    NONE = 0,
    UP = 4
}

// @public
interface InteractionConfig {
    DeadzoneRadius: number;
    HoverAndHold: Partial<HoverAndHoldInteractionSettings>;
    InteractionMaxDistanceCm: number;
    InteractionMinDistanceCm: number;
    InteractionType: InteractionType;
    InteractionZoneEnabled: boolean;
    TouchPlane: Partial<TouchPlaneInteractionSettings>;
    UseScrollingOrDragging: boolean;
    UseSwipeInteraction: boolean;
    // @internal
    VelocitySwipe: Partial<VelocitySwipeSettings>;
}

// @public
interface InteractionConfigFull {
    DeadzoneRadius: number;
    HoverAndHold: HoverAndHoldInteractionSettings;
    InteractionMaxDistanceCm: number;
    InteractionMinDistanceCm: number;
    InteractionType: InteractionType;
    InteractionZoneEnabled: boolean;
    TouchPlane: TouchPlaneInteractionSettings;
    UseScrollingOrDragging: boolean;
    UseSwipeInteraction: boolean;
}

// @public
export enum InteractionType {
    // @internal
    GRAB = 0,
    HOVER = 1,
    PUSH = 2,
    TOUCHPLANE = 3,
    // @internal
    VELOCITYSWIPE = 4
}

// @internal
interface InteractionZoneEvent {
    state: InteractionZoneState;
}

// @public
enum InteractionZoneState {
    HAND_ENTERED = 0,
    HAND_EXITED = 1
}

// @public
function MapRangeToRange(_value: number, _oldMin: number, _oldMax: number, _newMin: number, _newMax: number): number;

// @public
interface Mask {
    left: number;
    lower: number;
    right: number;
    upper: number;
}

// @internal
class MessageReceiver {
    constructor();
    actionCullToCount: number;
    actionQueue: Array<WebsocketInputAction>;
    analyticsRequestCallbacks: CallbackList<WebSocketResponse>;
    analyticsRequestQueue: WebSocketResponse[];
    callbackClearTimer: number;
    CheckForAction(): void;
    CheckForConfigState(): void;
    CheckForHandData(): void;
    CheckForHandshakeResponse(): void;
    CheckForResponse(): void;
    CheckForServiceStatus(): void;
    // @deprecated
    CheckForTrackingStateResponse(): void;
    ClearUnresponsivePromises(): void;
    configStateCallbacks: {
        [id: string]: ConfigStateCallback;
    };
    configStateQueue: Array<ConfigState>;
    // @deprecated
    HandleTrackingStateResponse(trackingStateResponse: TrackingStateResponse): void;
    handshakeCallbacks: {
        [id: string]: ResponseCallback;
    };
    handshakeQueue: Array<WebSocketResponse>;
    lastInteractionZoneUpdate: EventUpdate<InteractionZoneState>;
    lastKnownCursorPosition: Array<number>;
    lastStateUpdate: HandPresenceState;
    latestHandDataItem?: ArrayBuffer;
    responseCallbacks: {
        [id: string]: ResponseCallback;
    };
    responseQueue: Array<WebSocketResponse>;
    serviceStatusCallbacks: {
        [id: string]: ServiceStatusCallback;
    };
    serviceStatusQueue: Array<ServiceStatus>;
    trackingStateCallbacks: {
        [id: string]: TrackingStateCallback;
    };
    trackingStateQueue: Array<TrackingStateResponse>;
    Update(): void;
    updateRate: number;
}

// @internal
class PartialConfigState extends TouchFreeRequest {
    constructor(_id: string, _interaction: Partial<InteractionConfig> | null, _physical: Partial<PhysicalConfig> | null);
    interaction: Partial<InteractionConfig> | null;
    physical: Partial<PhysicalConfig> | null;
}

// @public
interface PhysicalConfig {
    LeapPositionRelativeToScreenBottomM: Vector;
    LeapRotationD: Vector;
    ScreenHeightM: number;
    ScreenHeightPX: number;
    ScreenRotationD: number;
    ScreenWidthPX: number;
}

declare namespace Plugins {
    export {
        InputActionManager,
        InputActionPlugin
    }
}
export { Plugins }

// @internal
export class RawBone {
    NextJoint: Vector;
    PrevJoint: Vector;
}

// @internal
export class RawFinger {
    Bones: RawBone[];
    Type: FingerType;
}

// @internal
export class RawHand {
    CurrentPrimary: boolean;
    Fingers: RawFinger[];
    WristPosition: Vector;
    WristWidth: number;
}

// @internal
class ResetInteractionConfigFileRequest extends TouchFreeRequest {
}

// @internal
class ResponseCallback extends TouchFreeRequestCallback<WebSocketResponse> {
}

// @internal
class ServiceConnection {
    constructor(_ip?: string, _port?: string);
    AnalyticsSessionRequest: (requestType: AnalyticsSessionRequestType, sessionID: string, callback?: ((detail: WebSocketResponse) => void) | undefined) => void;
    Disconnect: () => void;
    get handshakeComplete(): boolean;
    OnMessage: (_message: MessageEvent) => void;
    QuickSetupRequest: (atTopTarget: boolean, _callback: (detail: WebSocketResponse) => void, _configurationCallback: (detail: ConfigState) => void) => void;
    RequestConfigFile: (_callback: (detail: ConfigState) => void) => void;
    RequestConfigState: (_callback: (detail: ConfigState) => void) => void;
    RequestServiceStatus: (_callback: (detail: ServiceStatus) => void) => void;
    RequestTrackingChange: (_state: Partial<TrackingState>, _callback: ((detail: TrackingStateResponse) => void) | null) => void;
    RequestTrackingState: (_callback: (detail: TrackingStateResponse) => void) => void;
    ResetInteractionConfigFile: (_callback: (defaultConfig: ConfigState) => void) => void;
    SendMessage: <T extends WebSocketResponse>(_message: string, _requestID: string, _callback: ((detail: WebSocketResponse | T) => void) | null) => void;
    get touchFreeVersion(): string;
    UpdateAnalyticSessionEvents: (sessionID: string, callback?: ((detail: WebSocketResponse) => void) | undefined) => void;
    webSocket: WebSocket;
}

// @public
class ServiceStatus extends TouchFreeRequest {
    constructor(_id: string, _trackingServiceState: TrackingServiceState, _configurationState: ConfigurationState, _serviceVersion: string, _trackingVersion: string, _cameraSerial: string, _cameraFirmwareVersion: string);
    cameraFirmwareVersion: string;
    cameraSerial: string;
    configurationState: ConfigurationState;
    serviceVersion: string;
    trackingServiceState: TrackingServiceState;
    trackingVersion: string;
}

// @internal
class ServiceStatusCallback extends TouchFreeRequestCallback<ServiceStatus> {
}

// @internal
class ServiceStatusRequest extends TouchFreeRequest {
}

// @internal
class SimpleRequest {
    constructor(_id: string);
    requestID: string;
}

// @public
interface SuccessWrapper<T> {
    content?: T;
    msg: string;
    succeeded: boolean;
}

// @public
class SVGCursor extends TouchlessCursor {
    constructor(ringSizeMultiplier?: number, darkCursor?: boolean);
    // @internal
    protected HandleInputAction(inputData: TouchFreeInputAction): void;
    HideCursor(): void;
    ResetToDefaultColors(): void;
    ResetToDefaultScale(): void;
    // Warning: (ae-forgotten-export) The symbol "CursorPart" needs to be exported by the entry point index.d.ts
    SetColor(cursorPart: CursorPart, color: string): void;
    SetCursorOpacity(opacity: number): void;
    SetCursorOptimise(optimise: boolean): void;
    SetCursorScale(scale: number): void;
    SetRingThicknessScale(scale: number): void;
    ShowCursor(): void;
    // @internal
    protected UpdateCursor(inputAction: TouchFreeInputAction): void;
}

// @public
export interface TfInitParams {
    address?: Address;
    initialiseCursor?: boolean;
}

// @public
const TouchFree: {
    CurrentCursor: TouchlessCursor | undefined;
    GetCurrentCursor: () => TouchlessCursor | undefined;
    SetCurrentCursor: (cursor: TouchlessCursor | undefined) => TouchlessCursor | undefined;
    DispatchEvent: <TEvent extends TouchFreeEvent>(eventType: TEvent, ...args: Parameters<TouchFreeEventSignatures[TEvent]>) => void;
    Init: (tfInitParams?: TfInitParams) => void;
    InputController: WebInputController | undefined;
    GetInputController: () => WebInputController | undefined;
    IsConnected: () => boolean;
    RegisterEventCallback: <TEvent_1 extends TouchFreeEvent>(event: TEvent_1, callback: TouchFreeEventSignatures[TEvent_1]) => EventHandle;
    RegisterAnalyticEvents: (eventsIn?: AnalyticEventKey[]) => void;
    UnregisterAnalyticEvents: (eventsIn?: AnalyticEventKey[]) => void;
    IsAnalyticsActive: () => boolean;
    GetRegisteredAnalyticEventKeys: () => string[];
    GetAnalyticSessionEvents: () => AnalyticSessionEvents;
    StartAnalyticsSession: (applicationName: string, options?: StartAnalyticsSessionOptions) => void;
    StopAnalyticsSession: (applicationName: string, options?: StopAnalyticsSessionOptions) => void;
};
export { TouchFree }
export default TouchFree;

// @public
export type TouchFreeEvent = Extract<keyof TouchFreeEventSignatures, string>;

// @public
export interface TouchFreeEventSignatures {
    HandEntered: () => void;
    HandExited: () => void;
    HandFound: () => void;
    HandsLost: () => void;
    InputAction: (inputAction: TouchFreeInputAction) => void;
    OnConnected: () => void;
    OnServiceStatusChange: (state: ServiceStatus) => void;
    OnTrackingServiceStateChange: (state: TrackingServiceState) => void;
    // @internal
    TransmitHandData: (data: HandFrame) => void;
    TransmitInputAction: (inputAction: TouchFreeInputAction) => void;
    TransmitInputActionRaw: (inputAction: TouchFreeInputAction) => void;
    WhenConnected: () => void;
}

// @public
export class TouchFreeInputAction {
    constructor(_timestamp: number, _interactionType: InteractionType, _handType: HandType, _handChirality: HandChirality, _inputType: InputType, _cursorPosition: Array<number>, _distanceFromScreen: number, _progressToClick: number);
    Chirality: HandChirality;
    CursorPosition: Array<number>;
    DistanceFromScreen: number;
    HandType: HandType;
    InputType: InputType;
    InteractionType: InteractionType;
    ProgressToClick: number;
    Timestamp: number;
}

// @public @virtual
abstract class TouchFreeRequest {
    constructor(_requestID: string);
    requestID: string;
}

// @internal
abstract class TouchFreeRequestCallback<T> {
    constructor(_timestamp: number, _callback: (detail: T) => void);
    callback: (detail: T) => void;
    timestamp: number;
}

// @public
abstract class TouchlessCursor {
    constructor(_cursor: HTMLElement | SVGElement | undefined);
    cursor: HTMLElement | SVGElement | undefined;
    DisableCursor(): void;
    EnableCursor(): void;
    enabled: boolean;
    protected GetDimensions(cursor: HTMLElement): [number, number];
    protected HandleInputAction(_inputAction: TouchFreeInputAction): void;
    HideCursor(): void;
    protected opacityOnHandsLost: number;
    SetCursorOpacity(opacity: number): void;
    shouldShow: boolean;
    ShowCursor(): void;
    protected UpdateCursor(_inputAction: TouchFreeInputAction): void;
}

// @public
interface TouchPlaneInteractionSettings {
    TouchPlaneActivationDistanceCm: number;
    TouchPlaneTrackedPosition: TrackedPosition;
}

// @public
enum TrackedPosition {
    INDEX_STABLE = 0,
    INDEX_TIP = 1,
    NEAREST = 3,
    WRIST = 2
}

declare namespace Tracking {
    export {
        TrackingManager,
        Mask,
        TrackingState
    }
}
export { Tracking }

// @public
class TrackingManager {
    static ConvertResponseToState(_response: TrackingStateResponse): Partial<TrackingState>;
    static RequestTrackingChange(_state: Partial<TrackingState>, _callback?: ((detail: TrackingStateResponse) => void) | null): void;
    static RequestTrackingState(_callback: (detail: TrackingStateResponse) => void): void;
}

// @public
export enum TrackingServiceState {
    CONNECTED = 2,
    NO_CAMERA = 1,
    UNAVAILABLE = 0
}

// @public
class TrackingState {
    constructor(_mask: Mask, _cameraReversed: boolean, _allowImages: boolean, _analyticsEnabled: boolean);
    allowImages: boolean;
    analyticsEnabled: boolean;
    cameraReversed: boolean;
    mask: Mask;
}

// @internal
class TrackingStateCallback {
    constructor(_timestamp: number, _callback: (detail: TrackingStateResponse) => void);
    callback: (detail: TrackingStateResponse) => void;
    timestamp: number;
}

// @internal
class TrackingStateRequest {
    constructor(_id: string, _mask: Mask, _cameraReversed: boolean, _allowImages: boolean, _analyticsEnabled: boolean);
    allowImages: boolean;
    analyticsEnabled: boolean;
    cameraReversed: boolean;
    mask: Mask;
    requestID: string;
}

// @public
interface TrackingStateResponse {
    allowImages: SuccessWrapper<boolean> | null;
    analyticsEnabled: SuccessWrapper<boolean> | null;
    cameraReversed: SuccessWrapper<boolean> | null;
    mask: SuccessWrapper<Mask> | null;
    requestID: string;
}

// @internal
interface UpdateAnalyticSessionEventsRequest extends BaseAnalyticsRequest {
    sessionEvents: AnalyticSessionEvents;
}

declare namespace Utilities {
    export {
        MapRangeToRange
    }
}
export { Utilities }

// @public
interface Vector {
    X: number;
    Y: number;
    Z: number;
}

// @public
interface Vector2 {
    x: number;
    y: number;
}

// @internal
interface VelocitySwipeSettings {
    AllowBidirectionalScroll: boolean;
    AllowHorizontalScroll: boolean;
    AllowVerticalScroll: boolean;
    DownwardsMinVelocityIncrease_mmps: number;
    MaxLateralVelocity_mmps: number;
    MaxOpposingVelocity_mmps: number;
    MaxReleaseVelocity_mmps: number;
    MaxSwipeWidth: number;
    MinScrollVelocity_mmps: number;
    MinSwipeLength: number;
    ScrollDelayMs: number;
    SwipeWidthScaling: number;
    UpwardsMinVelocityDecrease_mmps: number;
}

// @public
class VersionHandshakeResponse extends WebSocketResponse {
    constructor(_id: string, _status: string, _msg: string, _request: string, _touchFreeVersion: string, _apiVersion: string);
    apiVersion: string;
    touchFreeVersion: string;
}

// @internal
export class VersionInfo {
    static readonly API_HEADER_NAME: string;
    static readonly ApiVersion: string;
}

// @public
class WebInputController extends BaseInputController {
    constructor();
    enterLeaveEnabled: boolean;
    // @internal
    protected HandleInputAction(_inputData: TouchFreeInputAction): void;
    // @internal
    HandleMove(_element: Element | null): void;
}

// @internal
export class WebsocketInputAction {
    constructor(_timestamp: number, _interactionFlags: BitmaskFlags, _cursorPosition: Vector2, _distanceFromScreen: number, _progressToClick: number);
    CursorPosition: Vector2;
    DistanceFromScreen: number;
    InteractionFlags: BitmaskFlags;
    ProgressToClick: number;
    Timestamp: number;
}

// @public
class WebSocketResponse extends TouchFreeRequest {
    constructor(_id: string, _status: string, _msg: string, _request: string);
    message: string;
    originalRequest: string;
    status: string;
}

// Warnings were encountered during analysis:
//
// src/TouchFree.ts:73:52 - (ae-incompatible-release-tags) The symbol "GetAnalyticSessionEvents" is marked as @public, but its signature references "AnalyticSessionEvents" which is marked as @internal
// src/TouchFree.ts:78:59 - (ae-forgotten-export) The symbol "StartAnalyticsSessionOptions" needs to be exported by the entry point index.d.ts
// src/TouchFree.ts:86:7 - (ae-incompatible-release-tags) The symbol "UnregisterAnalyticEvents" is marked as @public, but its signature references "AnalyticEventKey" which is marked as @internal
// src/TouchFree.ts:189:8 - (ae-forgotten-export) The symbol "StopAnalyticsSessionOptions" needs to be exported by the entry point index.d.ts
// src/TouchFree.ts:376:15 - (ae-incompatible-release-tags) The symbol "RegisterAnalyticEvents" is marked as @public, but its signature references "AnalyticEventKey" which is marked as @internal

```