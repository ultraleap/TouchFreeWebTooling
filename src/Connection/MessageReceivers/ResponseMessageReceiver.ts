import { CallbackHandler } from '../CallbackHandler';
import { ActionCode, WebSocketResponse } from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

export class ResponseMessageReceiver extends BaseMessageReceiver<WebSocketResponse> {
    public readonly actionCode: ActionCode[] = [
        ActionCode.CONFIGURATION_RESPONSE,
        ActionCode.SERVICE_STATUS_RESPONSE,
        ActionCode.CONFIGURATION_FILE_CHANGE_RESPONSE,
        ActionCode.QUICK_SETUP_RESPONSE,
    ];

    constructor(callbackHandler: CallbackHandler) {
        super(true);
        this.setup(() => this.CheckForState(callbackHandler));
    }

    // Function: CheckForState
    // Used to check the <responseQueue> for a <WebSocketResponse>. Sends it to Sends it to <HandleCallbackList> with
    // the <responseCallbacks> dictionary if there is one.
    CheckForState(callbackHandler: CallbackHandler): void {
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
    }
}
