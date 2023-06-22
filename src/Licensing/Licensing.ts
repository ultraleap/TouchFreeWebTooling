import { ConnectionManager } from '../Connection/ConnectionManager';
import { LicenseChangeResponse, LicenseStateResponse } from '../Connection/TouchFreeServiceTypes';

export enum LicenseState {
    UNLICENSED,
    LICENSED,
    CAMERA_UNLICENSED,
}

// Class: LicenseManager
// This class contains a collection of static methods for interacting with the Licensing state of TouchFree Service.
export class LicenseManager {
    // Property: currentState
    // Represents the current Licensing State of the service. May be out of date upon first
    // connection until License state changes, or <GetLicenseState> is invoked at lease once.
    public static currentState: LicenseState = LicenseState.UNLICENSED;

    // Function: GetLicenseState
    // Used to request a <LicenseState> representing the current state of the Service's Licenses via the WebSocket.
    // Provides a <LicenseState> asynchronously via the _callback parameter.
    //
    // If your _callback requires context it should be bound to that context via .bind()
    public static GetLicenseState(_callback: (detail: LicenseStateResponse) => void): void {
        ConnectionManager.serviceConnection()?.RequestLicenseState(_callback);
    }

    // Function: AddLicenseKey
    // Used to add a License key to those in use by TouchFree Service.
    // Provides a <LicenseChangeResponse> asynchronously via the _callback parameter, indicating if the change was
    // successful, along with details of why/not
    //
    // If your _callback requires context it should be bound to that context via .bind()
    public static AddLicenseKey(licenseKey: string, callback: (detail: LicenseChangeResponse) => void): void {
        ConnectionManager.serviceConnection()?.AddLicenseRequest(licenseKey, callback);
    }

    // Function: RemoveLicenseKey
    // Used to request removal of a License key from those in use by TouchFree Service. Provides a
    // Provides a <LicenseChangeResponse> asynchronously via the _callback parameter, indicating if the change was
    // successful, along with details of why/not
    //
    // If your _callback requires context it should be bound to that context via .bind()
    public static RemoveLicenseKey(licenseKey: string, callback: (detail: LicenseChangeResponse) => void): void {
        ConnectionManager.serviceConnection()?.RemoveLicenseRequest(licenseKey, callback);
    }
}
