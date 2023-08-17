import { CallbackHandler } from 'Connection/CallbackHandler';
import {
    ActionCode,
    LicenseChangeResponse,
} from '../../TouchFreeServiceTypes';
import { BaseMessageReceiver } from '../BaseMessageReceiver';

/**
 * Receives interaction zone messages from the service and distributes them
 *
 * @internal
 */
export class LicensingStateResponseMessageReciever extends BaseMessageReceiver<LicenseChangeResponse> {
    /**
     * The {@link ActionCode}s that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [
        ActionCode.ADD_LICENSE_RESPONSE,
        ActionCode.REMOVE_LICENSE_RESPONSE,
    ];

    /**
     * Sets up processing of responses to License State queries
     */
    constructor(callbackHandler: CallbackHandler) {
        super(true);
        this.setup(() => this.CheckQueue(this.queue, callbackHandler.licenseChangeCallbacks));
    }
}
