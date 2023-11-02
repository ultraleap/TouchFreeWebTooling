import { ActionCode } from '../../ActionCode';
import { type CallbackList } from '../../CallbackLists';
import { type LicenseStateResponse } from '../../RequestTypes';
import { BaseMessageReceiver } from '../BaseMessageReceiver';

/**
 * Receives interaction zone messages from the service and distributes them
 *
 * @internal
 */
export class LicensingStateResponseMessageReceiver extends BaseMessageReceiver<LicenseStateResponse> {
    /**
     * The {@link ActionCode}s that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.LICENSE_STATE_RESPONSE];

    /**
     * Sets up processing of responses to License State queries
     */
    constructor(callbackList: CallbackList<LicenseStateResponse>) {
        super(true);
        this.setup(() => this.checkQueue(this.queue, callbackList));
    }
}
