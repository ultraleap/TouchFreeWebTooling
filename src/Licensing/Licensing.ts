import { ConnectionManager } from '../Connection/ConnectionManager';
import { LicenseChangeResponse, LicenseStateResponse } from '../Connection/TouchFreeServiceTypes';

export enum LicenseState {
    UNLICENSED,
    LICENSED,
    CAMERA_UNLICENSED,
}

/**
 * This class contains a collection of static methods for interacting with the Licensing state of
 * TouchFree Service.
 */
export class LicenseManager {
    /**
     * Represents the current Licensing State of the service. May be out of date upon first
     * connection until License state changes, or {@link GetLicenseState} is invoked at lease once.
    */
    public static currentState: LicenseState = LicenseState.UNLICENSED;

    /**
     * Used to request a <LicenseState> representing the current state of the Service's Licenses via
     * the WebSocket.
     * @param _callback - Provides a {@link LicenseState} upon completion
     */

    public static GetLicenseState(_callback: (detail: LicenseStateResponse) => void): void {
        ConnectionManager.serviceConnection()?.RequestLicenseState(_callback);
    }

    /**
     * Use to attempt to add a License Key to TouchFree
     *
     * @param licenseKey - the license key you wish to add
     * @param _callback - Provides a {@link LicenseChangeResponse} upon completion, which includes
     * a boolean success/fail state and string content.
    */
    public static AddLicenseKey(licenseKey: string, callback: (detail: LicenseChangeResponse) => void): void {
        ConnectionManager.serviceConnection()?.AddLicenseRequest(licenseKey, callback);
    }

    /**
     * Use to attempt to remove a License Key from TouchFree
     *
     * @param licenseKey - the license key you wish to remove
     * @param _callback - Provides a {@link LicenseChangeResponse} upon completion, which includes
     * a boolean success/fail state and string content.
     */
    public static RemoveLicenseKey(licenseKey: string, callback: (detail: LicenseChangeResponse) => void): void {
        ConnectionManager.serviceConnection()?.RemoveLicenseRequest(licenseKey, callback);
    }
}
