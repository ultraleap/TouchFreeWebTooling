import { dispatchEventCallback } from '../../../TouchFreeEvents/TouchFreeEvents';
import { ActionCode } from '../../ActionCode';
import { type LicenseStateResponse } from '../../RequestTypes';
import { BaseMessageReceiver } from '../BaseMessageReceiver';

/**
 * Receives interaction zone messages from the service and distributes them
 *
 * @internal
 */
export class LicensingStateMessageReceiver extends BaseMessageReceiver<LicenseStateResponse> {
    /**
     * The {@link ActionCode}s that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.LICENSE_STATE];

    /**
     * Sets up consuming interaction zone messages and sending them to the {@link ConnectionManager}
     */
    constructor() {
        super(true);
        this.setup(() => this.checkForState());
    }

    /**
     * Checks the latest message and processes it if it has not been processed yet
     */
    checkForState = (): void => {
        const licenseState: LicenseStateResponse | undefined = this.queue.shift();

        if (licenseState) {
            dispatchEventCallback('onLicenseStateChange', licenseState.licenseState);
        }
    };
}
