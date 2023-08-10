import { CallbackHandler } from '../CallbackHandler';
import { ActionCode, TrackingStateResponse } from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

export class TrackingStateMessageReceiver extends BaseMessageReceiver<TrackingStateResponse> {
    public readonly actionCode: ActionCode[] = [ActionCode.TRACKING_STATE];
    constructor(callbackHandler: CallbackHandler) {
        super(true);
        this.setup(() => this.CheckQueue(this.queue, callbackHandler.trackingStateCallbacks));
    }
}
