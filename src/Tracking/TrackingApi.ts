import { ConnectionManager, TrackingStateResponse } from '../Connection';
import { TrackingState } from './TrackingTypes';

/**
 * Request a {@link TrackingStateResponse} representing the current state of the tracking software
 * @remarks
 * Use {@link convertResponseToState} on the response to get TrackingState in a more helpful form
 * @param callback - Callback to call with {@link TrackingStateResponse}
 *
 * @public
 */
export function requestTrackingState(callback?: (detail: TrackingStateResponse) => void) {
    if (!callback) {
        console.error('Config file state request failed. This call requires a callback.');
        return;
    }

    ConnectionManager.serviceConnection()?.requestTrackingState(callback);
}

/**
 * Requests a modification to the tracking software's settings.
 * @param state - State to request. Options not provided within the object will not be modified.
 * @param callback - Optional callback if you require confirmation that settings were changed correctly.
 *
 * @public
 */
export function requestTrackingChange(
    state: Partial<TrackingState>,
    callback?: (detail: TrackingStateResponse) => void
): void {
    ConnectionManager.serviceConnection()?.requestTrackingChange(state, callback);
}

/**
 * Converts a {@link TrackingStateResponse} to a partial {@link TrackingState} to make the
 * response easier to consume.
 * @param response - Response to convert
 * @returns Converted Partial {@link TrackingState}
 *
 * @public
 */
export function convertResponseToState(response: TrackingStateResponse): Partial<TrackingState> {
    const newResponse: Partial<TrackingState> = {};

    if (response.mask !== undefined && response.mask !== null) {
        newResponse.mask = response.mask.content;
    }

    if (response.cameraReversed !== undefined && response.cameraReversed !== null) {
        newResponse.cameraReversed = response.cameraReversed.content;
    }

    if (response.allowImages !== undefined && response.allowImages !== null) {
        newResponse.allowImages = response.allowImages.content;
    }

    if (response.analyticsEnabled !== undefined && response.analyticsEnabled !== null) {
        newResponse.analyticsEnabled = response.analyticsEnabled.content;
    }

    return newResponse;
}
