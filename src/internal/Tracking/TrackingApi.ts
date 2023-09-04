import { getServiceConnection } from '../Connection/ConnectionApi';
import { TrackingStateResponse } from '../Connection/RequestTypes';
import { TrackingState } from './TrackingTypes';

/**
 * Request a {@link TrackingState} representing the current state of the tracking software
 * @remarks
 * @param callback - Callback to call with {@link TrackingState}
 *
 * @internal
 */
export function requestTrackingState(callback?: (detail: Partial<TrackingState>) => void) {
    if (!callback) {
        console.error('Config file state request failed. This call requires a callback.');
        return;
    }

    getServiceConnection()?.requestTrackingState((trackingState) => {
        callback(convertResponseToState(trackingState));
    });
}

/**
 * Requests a modification to the tracking software's settings.
 * @param state - State to request. Options not provided within the object will not be modified.
 * @param callback - Optional callback if you require confirmation that settings were changed correctly.
 *
 * @internal
 */
export function requestTrackingChange(
    state: Partial<TrackingState>,
    callback?: (detail: Partial<TrackingState>) => void
): void {
    getServiceConnection()?.requestTrackingChange(state, (trackingState) => {
        if (callback) {
            callback(convertResponseToState(trackingState));
        }
    });
}

/**
 * Converts a {@link TrackingStateResponse} to a partial {@link TrackingState} to make the
 * response easier to consume.
 * @param response - Response to convert
 * @returns Converted Partial {@link TrackingState}
 */
function convertResponseToState(response: TrackingStateResponse): Partial<TrackingState> {
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
