import { getServiceConnection } from '../Connection/ConnectionApi';

/**
 * @internal
 */
export enum LicenseState {
    UNLICENSED,
    LICENSED,
    CAMERA_UNLICENSED,
}

let currentState: LicenseState = LicenseState.UNLICENSED;

/**
 * Get the current Licensing State of the service. May be out of date upon first
 * connection until License state changes, or {@link requestGetLicenseState} is invoked at lease once.
 * @internal
 */
export function getLicenseState() {
    return currentState;
}

/**
 * Used to request a <LicenseState> representing the current state of the Service's Licenses via
 * the WebSocket.
 * @param callback - Provides a {@link LicenseState} upon completion
 * @internal
 */
export function requestGetLicenseState(callback: (detail: LicenseState) => void): void {
    getServiceConnection()?.requestLicenseState((response) => {
        currentState = response.licenseState;
        callback(response.licenseState);
    });
}

/**
 * @internal
 */
export interface LicenseChangeResult {
    changeDetails: string;
    succeeded: boolean;
}

/**
 * Use to attempt to add a License Key to TouchFree
 *
 * @param licenseKey - the license key you wish to add
 * @param callback - Provides a {@link LicenseChangeResult} upon completion, which includes
 * a boolean success/fail state and string content.
 * @internal
 */
export function requestAddLicenseKey(licenseKey: string, callback: (detail: LicenseChangeResult) => void): void {
    getServiceConnection()?.addLicenseRequest(licenseKey, callback);
}

/**
 * Use to attempt to remove a License Key from TouchFree
 *
 * @param licenseKey - the license key you wish to remove
 * @param callback - Provides a {@link LicenseChangeResult} upon completion, which includes
 * a boolean success/fail state and string content.
 * @internal
 */
export function requestRemoveLicenseKey(licenseKey: string, callback: (detail: LicenseChangeResult) => void): void {
    getServiceConnection()?.removeLicenseRequest(licenseKey, callback);
}
