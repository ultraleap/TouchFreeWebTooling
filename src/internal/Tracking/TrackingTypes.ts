/**
 * Masking values to apply to each edge of the camera's feed
 * @public
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
 * @public
 */
export class TrackingState {
    /** Camera masking state */
    mask: Mask;
    /** Is camera orientation reversed from normal? */
    cameraReversed: boolean;
    /** Toggle images being sent from the camera */
    allowImages: boolean;
    /** Toggle analytics */
    analyticsEnabled: boolean;

    constructor(mask: Mask, cameraReversed: boolean, allowImages: boolean, analyticsEnabled: boolean) {
        this.mask = mask;
        this.cameraReversed = cameraReversed;
        this.allowImages = allowImages;
        this.analyticsEnabled = analyticsEnabled;
    }
}
