import TouchFree from 'TouchFree';
import { ConnectionManager } from '../../ConnectionManager';
import {
    ActionCode,
    LicenseStateResponse,
} from '../../TouchFreeServiceTypes';
import { BaseMessageReceiver } from '../BaseMessageReceiver';

/**
 * Receives interaction zone messages from the service and distributes them
 *
 * @internal
 */
export class LicensingStateMessageReciever extends BaseMessageReceiver<LicenseStateResponse> {
    /**
     * The {@link ActionCode}s that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.LICENSE_STATE];

    /**
     * Sets up consuming interaction zone messages and sending them to the {@link ConnectionManager}
     */
    constructor() {
        super(true);
        this.setup(() => this.CheckForState());
    }

    /**
     * Checks the latest message and processes it if it has not been processed yet
     */
    CheckForState = (): void => {
        const licenseState: LicenseStateResponse | undefined = this.queue.shift();

        if (licenseState) {
            TouchFree.DispatchEvent('OnLicenseStateChange', licenseState.licenseState);
        }
    };
}
