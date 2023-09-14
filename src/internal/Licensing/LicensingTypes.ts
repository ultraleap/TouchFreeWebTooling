/**
 * @internal
 */
export enum LicenseState {
    UNLICENSED,
    LICENSED,
    CAMERA_UNLICENSED,
}

/**
 * @internal
 */
export interface LicenseChangeResult {
    changeDetails: string;
    succeeded: boolean;
}