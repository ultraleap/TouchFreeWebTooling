import { CallbackHandler } from 'Connection/CallbackHandler';
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
export class LicensingStateResponseMessageReciever extends BaseMessageReceiver<LicenseStateResponse> {
    /**
     * The {@link ActionCode}s that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.LICENSE_STATE_RESPONSE];

    /**
     * Sets up processing of responses to License State queries
     */
    constructor(callbackHandler: CallbackHandler) {
        super(true);
        this.setup(() => this.CheckQueue(this.queue, callbackHandler.licenseStateCallbacks));
    }
}
