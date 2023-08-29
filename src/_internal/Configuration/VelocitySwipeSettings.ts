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
