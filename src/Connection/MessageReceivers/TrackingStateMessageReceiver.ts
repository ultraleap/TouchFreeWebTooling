import { CallbackHandler } from '../CallbackHandler';
import { ActionCode, TrackingStateResponse } from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

/**
 * Receives tracking state messages from the service and distributes them
 *
 * @internal
 */
export class TrackingStateMessageReceiver extends BaseMessageReceiver<TrackingStateResponse> {
    /**
     * The {@link ActionCode | ActionCodes} that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.TRACKING_STATE];

    /**
     * Sets up consuming messages from a queue and passing them to the callbacks
     */
    constructor(callbackHandler: CallbackHandler) {
        super(true);
        this.setup(() => this.checkQueue(this.queue, callbackHandler.trackingStateCallbacks));
    }
}
