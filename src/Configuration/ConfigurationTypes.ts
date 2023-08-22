// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ConfigState } from '../Connection';
import { InteractionType } from '../TouchFreeToolingTypes';
import { Vector } from 'Math';

/**
 * Container for all of the settings related to the interactions being processed by the TouchFree Service.
 *
 * @remarks
 * The settings at the root of this object will affect all interactions.
 * There are also some settings specific to the Hover and Hold interaction which can
 * be modified by changing the contained `HoverAndHoldInteractionSettings`.
 *
 * In order to modify the settings of the service, create an instance of this class, make the
 * changes you wish to see, and then send it to the service using the Configuration API.
 *
 * Like all of the Settings classes found in this file, all members are optional. If you do
 * not modify a member of this class, its value will not change when sent to the TouchFree Service.
 *
 * @public
 */
export interface InteractionConfig {
    /**
     * If true, allows interactions to send up/down events separately, enabling dragging or
     * touchscreen-like scrolling behaviours. If false, up/down events will be sent together,
     * and every down will function like a click of its own.
     */
    UseScrollingOrDragging: boolean;

    /**
     * If true, enables the swipe interaction alongside AirPush, Hover and Hold or TouchPlane
     * if one of those interactions is configured
     */
    UseSwipeInteraction: boolean;

    /**
     * All interactions use a small deadzone to stabilise the position of the cursor, to prevent
     * small user movements from making the cursor shake in place. This setting controls the
     * radius of that deadzone.
     * Measured in Metres.
     */
    DeadzoneRadius: number;

    /** Changes whether the Interaction Zone values will be used */
    InteractionZoneEnabled: boolean;

    /**
     * The minimum distance from the screen that users can interact within.
     * Measured in Centimetres.
     */
    InteractionMinDistanceCm: number;

    /**
     * The maximum distance from the screen that users can interact within.
     * Measured in Centimetres.
     */
    InteractionMaxDistanceCm: number;

    /** This represents the type of interaction currently selected */
    InteractionType: InteractionType;

    /**
     * Partial Hover and Hold specific settings
     * @see HoverAndHoldInteractionSettings
     */
    HoverAndHold: Partial<HoverAndHoldInteractionSettings>;
    /**
     * Partial TouchPlane specific settings
     * @see TouchPlaneInteractionSettings
     */
    TouchPlane: Partial<TouchPlaneInteractionSettings>;
    /**
     * Partial VelocitySwipe specific settings
     * @see VelocitySwipeSettings
     * @internal
     */
    VelocitySwipe: Partial<VelocitySwipeSettings>;
}

/**
 * This class is duplicate of {@link InteractionConfig} without the Interactions data being optional
 * This form of {@link InteractionConfig} is used in the {@link ConfigState} object returned when requesting
 * the current state of the Service's config or its config files.
 * @public
 */
export interface InteractionConfigFull {
    /**
     * If true, allows interactions to send up/down events separately, enabling dragging or
     * touchscreen-like scrolling behaviours. If false, up/down events will be sent together,
     * and every down will function like a click of its own.
     */
    UseScrollingOrDragging: boolean;

    /**
     * If true, enables the swipe interaction alongside AirPush, Hover and Hold or TouchPlane
     * if one of those interactions is configured
     */
    UseSwipeInteraction: boolean;

    /**
     * All interactions use a small deadzone to stabilise the position of the cursor, to prevent
     * small user movements from making the cursor shake in place. This setting controls the
     * radius of that deadzone.
     * Measured in Metres.
     */
    DeadzoneRadius: number;

    /** Changes whether the Interaction Zone values will be used */
    InteractionZoneEnabled: boolean;

    /**
     * The minimum distance from the screen that users can interact within.
     * Measured in Centimetres.
     */
    InteractionMinDistanceCm: number;

    /**
     * The maximum distance from the screen that users can interact within.
     * Measured in Centimetres.
     */
    InteractionMaxDistanceCm: number;

    /** This represents the type of interaction currently selected */
    InteractionType: InteractionType;
    /**
     * Hover and Hold specific settings
     * @see HoverAndHoldInteractionSettings
     */
    HoverAndHold: HoverAndHoldInteractionSettings;
    /**
     * TouchPlane specific settings
     * @see TouchPlaneInteractionSettings
     */
    TouchPlane: TouchPlaneInteractionSettings;
}

/**
 * Container for settings that only apply to the Hover and Hold interaction.
 *
 * @remarks
 * In order to modify these settings of the TouchFree Service, create an `InteractionConfig`,
 * which contains an instance of this class, modify it as required, and then pass to the service
 * using the Configuration API.
 *
 * Like all of the Settings classes found in this file, all members are optional. If you do
 * not modify a member of this class, its value will not change when sent to the TouchFree Service.
 *
 * @public
 */
export interface HoverAndHoldInteractionSettings {
    /**
     * This determines how long the user must hold their hand in place before the
     * interaction will begin. If the hand remains in place until the interaction completes,
     * a click event will be sent.
     * Measured in Seconds.
     */
    HoverStartTimeS: number;

    /**
     * This determines how long the user must hold their hand in place after the
     * interaction has begun before the interaction will complete, and a click event will be
     * sent.
     * Measured in Seconds.
     */
    HoverCompleteTimeS: number;
}

/**
 * Container for settings that only apply to the TouchPlane interaction.
 *
 * @remarks
 * In order to modify these settings of the TouchFree Service, create an {@link InteractionConfig},
 * which contains an instance of this class, modify it as required, and then pass to the service
 * using the Configuration API.
 *
 * Like all of the Settings classes found in this file, all members are optional. If you do
 * not modify a member of this class, its value will not change when sent to the TouchFree Service.
 *
 * @public
 */
export interface TouchPlaneInteractionSettings {
    /**
     * This determines how far the TouchPlane is from the screen surface. This
     * represents the plane that the user must pass to begin and end a click event.
     * Measured in Centimetres.
     */
    TouchPlaneActivationDistanceCm: number;

    /**
     * This determines which bone position will be tracked when performing the interaction.
     */
    TouchPlaneTrackedPosition: TrackedPosition;
}

/**
 * Container for settings that only apply to the VelocitySwipe interaction.
 * Currently experimental - beware use in production.
 *
 * @remarks
 * In order to modify these settings of the TouchFree Service, create an `InteractionConfig`,
 * which contains an instance of this class, modify it as required, and then pass to the service
 * using the Configuration API.
 *
 * Like all of the Settings classes found in this file, all members are optional. If you do
 * not modify a member of this class, its value will not change when sent to the TouchFree Service.
 *
 * @internal
 */
export interface VelocitySwipeSettings {
    /**
     * Minimum horizontal scroll velocity to trigger a swipe.
     * Measured in Millimetres per Second.
     */
    MinScrollVelocity_mmps: number;
    /**
     * The amount the minimum velocity is decreased when moving in an upwards direction.
     * Measured in Millimetres per Second.
     */
    UpwardsMinVelocityDecrease_mmps: number;
    /**
     * The amount the minimum velocity is increased when moving in a downwards direction
     * Measured in Millimetres per Second.
     */
    DownwardsMinVelocityIncrease_mmps: number;
    /**
     * The maximum velocity for releasing a swipe.
     * Measured in Millimetres per Second.
     */
    MaxReleaseVelocity_mmps: number;
    /**
     * The maximum allowed velocity perpendicular to the swipe direction during swipe triggering.
     * Measured in Millimetres per Second.
     */
    MaxLateralVelocity_mmps: number;
    /**
     * If a user is over this velocity in the direction opposite to the previous swipe when the scroll delay
     * expires then they are required to go below this velocity before they are able to swipe again.
     * Measured in Millimetres per Second.
     */
    MaxOpposingVelocity_mmps: number;
    /**
     * The minimum amount of time before the user can swipe again.
     * Measured in Milliseconds.
     */
    ScrollDelayMs: number;
    /**
     * Minimum distance to trigger a swipe
     * Measured in Millimetres.
     */
    MinSwipeLength: number;
    /**
     * Travelling perpendicular to the swipe further than this will cancel the swipe. See {@link SwipeWidthScaling}.
     * Measured in Millimetres.
     */
    MaxSwipeWidth: number;
    /** Increases the MaxSwipeWidth by `distance travelled * this value` to allow greater tolerance */
    SwipeWidthScaling: number;
    /** Toggle to allow scrolling forwards and backwards */
    AllowBidirectionalScroll: boolean;
    /** Toggle to allow scrolling left / right */
    AllowHorizontalScroll: boolean;
    /** Toggle to allow scrolling up / down */
    AllowVerticalScroll: boolean;
}

/**
 * Container for all of the settings related to the physical setup of the hardware,
 * both the tracking camera and the display.
 *
 * @remarks
 * In order to modify these settings of the TouchFree Service, create an instance of this class,
 * modify it as required, and then send it to the service using the Configuration API.
 *
 * Like all of the Settings classes found in this file, all members are optional. If you do
 * not modify a member of this class, its value will not change when sent to the TouchFree Service.
 *
 * @public
 */
export interface PhysicalConfig {
    /**
     * The height of the screen in meters. This is needed in order to determine the relationship
     * between hand location in the real world and pixel locations on screen.
     * Measured in Metres.
     */
    ScreenHeightM: number;

    /**
     * The position (in meters) in 3d space of the camera relative to the
     * center of the bottom edge of the screen.
     * Measured in Metres.
     *
     * @remarks
     * This uses a left handed coordinate system where:
     * X = left/right (right = positive)
     * Y = up/down (up = positive)
     * Z = forward/backward (forward = positive)
     */
    LeapPositionRelativeToScreenBottomM: Vector;

    /**
     * The rotation of the camera relative to world space.
     * Measured in Degrees.
     */
    LeapRotationD: Vector;

    /**
     * The rotation of the physical screen relative to world space.
     * Measured in Degrees.
     */
    ScreenRotationD: number;

    /**
     * The width (in pixels) of the screen.
     * Measured in Pixels.
     */
    ScreenWidthPX: number;

    /**
     * The height (in pixels) of the screen.
     * Measured in Pixels.
     */
    ScreenHeightPX: number;
}

/**
 * Explicitly named tracked positions
 * @public
 */
export enum TrackedPosition {
    /** Towards the screen from the proximal knuckle position of the index finger */
    INDEX_STABLE,
    /** The index finger tip position */
    INDEX_TIP,
    /** The wrist position */
    WRIST,
    /** The nearest bone to the screen */
    NEAREST,
}
