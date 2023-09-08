import { ActionCode } from '../ActionCode';
import { CallbackList } from '../CallbackLists';
import { WebSocketResponse } from '../RequestTypes';
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
    constructor(callbackList: CallbackList<WebSocketResponse>) {
        super(true);
        this.setup(() => this.checkQueue(this.queue, callbackList));
    }
}
