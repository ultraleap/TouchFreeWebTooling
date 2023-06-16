import { ConnectionManager } from '../Connection/ConnectionManager';
import { LicenseChangeResponse, LicenseStateResponse } from '../Connection/TouchFreeServiceTypes';

export enum LicenseState {
    UNLICENSED,
    LICENSED,
    CAMERA_UNLICENSED,
}

export class LicenseManager {
    public static currentState: LicenseState = LicenseState.UNLICENSED;

    public static GetLicenseState(_callback: (detail: LicenseStateResponse) => void): void {
        const callbackWrapper = (detail: LicenseStateResponse) => {
            LicenseManager.currentState = detail.licenseState;
            _callback(detail);
        };

        ConnectionManager.serviceConnection()?.RequestLicenseState(callbackWrapper);
    }

    public static AddLicenseKey(licenseKey: string, callback: (detail: LicenseChangeResponse) => void): void {
        ConnectionManager.serviceConnection()?.AddLicenseRequest(licenseKey, callback);
    }

    public static RemoveLicenseKey(licenseKey: string, callback: (detail: LicenseChangeResponse) => void): void {
        ConnectionManager.serviceConnection()?.RemoveLicenseRequest(licenseKey, callback);
    }
}
