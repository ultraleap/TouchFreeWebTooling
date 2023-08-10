import { CallbackHandler } from '../CallbackHandler';
import { ActionCode, WebSocketResponse } from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

export class AnalyticsMessageReceiver extends BaseMessageReceiver<WebSocketResponse> {
    public readonly actionCode: ActionCode[] = [
        ActionCode.ANALYTICS_SESSION_REQUEST,
        ActionCode.ANALYTICS_UPDATE_SESSION_EVENTS_REQUEST,
    ];

    constructor(callbackHandler: CallbackHandler) {
        super(true);
        this.setup(() => this.CheckQueue(this.queue, callbackHandler.analyticsRequestCallbacks));
    }
}
