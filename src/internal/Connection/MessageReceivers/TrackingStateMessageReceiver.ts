import { ActionCode } from '../ActionCode';
import { type CallbackList } from '../CallbackLists';
import { type TrackingStateResponse } from '../RequestTypes';
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
    constructor(callbackList: CallbackList<TrackingStateResponse>) {
        super(true);
        this.setup(() => this.checkQueue(this.queue, callbackList));
    }
}
