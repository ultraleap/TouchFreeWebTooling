import { CallbackHandler } from '../CallbackHandler';
import { ActionCode, WebSocketResponse } from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

export class VersionHandshakeMessageReceiver extends BaseMessageReceiver<WebSocketResponse> {
    /**
     * The {@link ActionCode}s that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.VERSION_HANDSHAKE_RESPONSE];

    /**
     * Sets up consuming messages from a queue and passing them to the callbacks
     */
    constructor(callbackHandler: CallbackHandler) {
        super(true);
        this.setup(() => this.CheckForState(callbackHandler));
    }

    /**
     * Checks {@link queue} for a single {@link WebSocketResponse} and handles it.
     */
    CheckForState = (callbackHandler: CallbackHandler): void => {
        const response: WebSocketResponse | undefined = this.queue.shift();

        if (response) {
            const responseResult = BaseMessageReceiver.HandleCallbackList(response, callbackHandler.handshakeCallbacks);

            switch (responseResult) {
                case 'NoCallbacksFound':
                    BaseMessageReceiver.LogNoCallbacksWarning(response);
                    break;
                case 'Success':
                    if (response.message && response.status === 'Success') {
                        if (response.message.indexOf('Handshake Warning') >= 0) {
                            console.warn('Received Handshake Warning from TouchFree:\n' + response.message);
                        } else {
                            console.log('Received Handshake Success from TouchFree:\n' + response.message);
                        }
                    } else {
                        console.error('Received Handshake Error from TouchFree:\n' + response.message);
                    }
                    break;
            }
        }
    };
}
