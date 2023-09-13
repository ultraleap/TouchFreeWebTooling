import { ActionCode } from '../../ActionCode';
import { CallbackList } from '../../CallbackLists';
import { LicenseChangeResponse } from '../../RequestTypes';
import { BaseMessageReceiver } from '../BaseMessageReceiver';

/**
 * Receives interaction zone messages from the service and distributes them
 *
 * @internal
 */
export class LicensingChangeResponseMessageReceiver extends BaseMessageReceiver<LicenseChangeResponse> {
    /**
     * The {@link ActionCode}s that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.ADD_LICENSE_RESPONSE, ActionCode.REMOVE_LICENSE_RESPONSE];

    /**
     * Sets up processing of responses to License State queries
     */
    constructor(callbackList: CallbackList<LicenseChangeResponse>) {
        super(true);
        this.setup(() => this.checkQueue(this.queue, callbackList));
    }
}
