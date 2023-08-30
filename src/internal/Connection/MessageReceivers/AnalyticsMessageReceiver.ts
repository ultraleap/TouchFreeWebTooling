import { ActionCode, CallbackHandler, WebSocketResponse } from '../../index';
import { BaseMessageReceiver } from './BaseMessageReceiver';

/**
 * Receives analytics messages from the service and distributes them
 *
 * @internal
 */
export class AnalyticsMessageReceiver extends BaseMessageReceiver<WebSocketResponse> {
    /**
     * The {@link ActionCode | ActionCodes} that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [
        ActionCode.ANALYTICS_SESSION_REQUEST,
        ActionCode.ANALYTICS_UPDATE_SESSION_EVENTS_REQUEST,
    ];

    /**
     * Sets up consuming messages from a queue and passing them to the callbacks
     */
    constructor(callbackHandler: CallbackHandler) {
        super(true);
        this.setup(() => this.checkQueue(this.queue, callbackHandler.analyticsRequestCallbacks));
    }
}
