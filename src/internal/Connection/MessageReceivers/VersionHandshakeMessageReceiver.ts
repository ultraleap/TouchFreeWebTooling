import { ActionCode } from '../ActionCode';
import { type CallbackList } from '../CallbackLists';
import { type WebSocketResponse } from '../RequestTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

/**
 * Receives handshake messages from the service and distributes them
 *
 * @internal
 */
export class VersionHandshakeMessageReceiver extends BaseMessageReceiver<WebSocketResponse> {
    /**
     * The {@link ActionCode | ActionCodes} that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.VERSION_HANDSHAKE_RESPONSE];

    /**
     * Sets up consuming messages from a queue and passing them to the callbacks
     */
    constructor(callbackList: CallbackList<WebSocketResponse>) {
        super(true);
        this.setup(() => this.checkForState(callbackList));
    }

    /**
     * Checks {@link queue} for a single {@link WebSocketResponse} and handles it.
     */
    checkForState = (callbackList: CallbackList<WebSocketResponse>): void => {
        const response: WebSocketResponse | undefined = this.queue.shift();

        if (response) {
            const responseResult = BaseMessageReceiver.handleCallbackList(response, callbackList);

            const configStateError = (response as HandshakeExtraInformation)?.configurationStateError;

            switch (responseResult) {
                case 'NoCallbacksFound':
                    BaseMessageReceiver.logNoCallbacksWarning(response);
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

                    if (configStateError) {
                        if (configStateError === 'ERROR') {
                            console.error(
                                'Received Configuration State Error from TouchFree. ' +
                                    'Error loading configuration files.'
                            );
                        } else if (configStateError === 'DEFAULT') {
                            console.warn(
                                'Received Configuration State Warning from TouchFree. ' +
                                    'Configuration is default, perform a setup to resolve'
                            );
                        }
                    }
                    break;
            }
        }
    };
}

/**
 * Contains extra information that can be included in a handshake message
 * @internal
 */
interface HandshakeExtraInformation {
    /**
     * An optional error than contains information about the configuration state
     */
    configurationStateError?: string;
}
