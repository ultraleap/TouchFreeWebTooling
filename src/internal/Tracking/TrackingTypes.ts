/**
 * Masking values to apply to each edge of the camera's feed
 * @internal
 */
export interface Mask {
    /** Amount of masking to apply to the left edge */
    left: number;
    /** Amount of masking to apply to the right edge */
    right: number;
    /** Amount of masking to apply to the top edge */
    upper: number;
    /** Amount of masking to apply to the bottom edge */
    lower: number;
}

/**
 * Represents the settings available for modification in the Tracking API
 * @internal
 */
export interface TrackingState {
    /** Camera masking state */
    mask: Mask;
    /** Is camera orientation reversed from normal? */
    cameraReversed: boolean;
    /** Toggle images being sent from the camera */
    allowImages: boolean;
    /** Toggle analytics */
    analyticsEnabled: boolean;
}
