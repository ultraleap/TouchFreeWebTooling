import { CallbackHandler } from '../CallbackHandler';
import { ActionCode, WebSocketResponse } from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

/**
 * Receives response messages from the service and distributes them
 *
 * @internal
 */
export class ResponseMessageReceiver extends BaseMessageReceiver<WebSocketResponse> {
    /**
     * The {@link ActionCode}s that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [
        ActionCode.CONFIGURATION_RESPONSE,
        ActionCode.SERVICE_STATUS_RESPONSE,
        ActionCode.CONFIGURATION_FILE_CHANGE_RESPONSE,
        ActionCode.QUICK_SETUP_RESPONSE,
    ];

    /**
     * Sets up consuming messages from a queue and passing them to the callbacks
     */
    constructor(callbackHandler: CallbackHandler) {
        super(true);
        this.setup(() => this.CheckForState(callbackHandler));
    }

    /**
     * Used to check the {@link queue} for a {@link WebSocketResponse}.
     * Sends it to {@link HandleCallbackList} with the {@link responseCallbacks} dictionary if there is one.
     */
    CheckForState = (callbackHandler: CallbackHandler): void => {
        const response: WebSocketResponse | undefined = this.queue.shift();

        if (response) {
            const responseResult = BaseMessageReceiver.HandleCallbackList(response, callbackHandler.responseCallbacks);

            switch (responseResult) {
                case 'NoCallbacksFound':
                    BaseMessageReceiver.LogNoCallbacksWarning(response);
                    break;
                case 'Success':
                    if (response.message) {
                        // This is logged to aid users in debugging
                        console.log('Successfully received WebSocketResponse from TouchFree:\n' + response.message);
                    }
                    break;
            }
        }
    };
}
