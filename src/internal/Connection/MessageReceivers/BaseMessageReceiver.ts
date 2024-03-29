import { ActionCode } from '../ActionCode';
import { type CallbackList } from '../CallbackLists';
import { type TouchFreeRequest, type WebSocketResponse } from '../RequestTypes';
import { type CommunicationWrapper } from '../ServiceTypes';

export interface MessageReceiver {
    receiveMessage: (message: CommunicationWrapper<unknown>) => void;
    actionCode: ActionCode[];
}

/**
 * Base message receiver class to contain generic message processing functionality
 *
 * @internal
 */
export abstract class BaseMessageReceiver<ConvertedMessage> implements MessageReceiver {
    /**
     * Constructs the class
     *
     * @param useQueue - Whether the message receiver should use a queue or just store the last item
     */
    constructor(useQueue: boolean) {
        this.useQueue = useQueue;
    }

    /**
     * The {@link ActionCode | ActionCodes} that are handled by this message receiver
     */
    public abstract readonly actionCode: ActionCode[];

    /**
     * Whether the message receiver should use a queue or just store the last item
     */
    private useQueue: boolean;

    /**
     * How many times per second to process {@link queue} or check {@link lastItem}.
     */
    private updateRate = 60;

    /**
     * Duration (in seconds) of update interval - inverse of {@link updateRate}
     */
    private updateDuration: number = (1 / this.updateRate) * 1000;

    /**
     * Starts a regular interval - {@link checkQueue} (at {@link updateRate})
     */
    setup = (checkQueue: TimerHandler) => {
        setInterval(checkQueue, this.updateDuration);
    };

    /**
     * A queue of {@link ConvertedMessage | Messages} that have been received from the Service.
     */
    protected queue: ConvertedMessage[] = [];

    /**
     * The latest {@link ConvertedMessage} that has been received from the Service.
     */
    protected lastItem: ConvertedMessage | undefined;

    /**
     * Handles processing the message from the service into a consumable format
     * and adds it either to a queue or updates the latest item depending on the
     * value of {@link useQueue}
     *
     * @param message - The message received from the Service
     */
    receiveMessage = (message: CommunicationWrapper<unknown>) => {
        const messageContent = message.content as ConvertedMessage;
        if (this.useQueue) {
            this.queue.push(messageContent);
        } else {
            this.lastItem = messageContent;
        }
    };

    /**
     * Takes an item off a queue and passes it to be handled
     *
     * @param queue - The message queue to process
     * @param callbacks - The callback list to check the response against
     */
    protected checkQueue = <T extends TouchFreeRequest>(queue: T[], callbacks: CallbackList<T>) => {
        const response = queue.shift();
        BaseMessageReceiver.handleCallbackList(response, callbacks);
    };

    /**
     * Checks a callback dictionary for a request id and handles invoking the callback.
     *
     * @param callbackResult - Callback data
     * @param callbacks - Callback dictionary to check
     * @returns String literal result representing success or what went wrong
     */
    protected static handleCallbackList = <T extends TouchFreeRequest>(
        callbackResult?: T,
        callbacks?: CallbackList<T>
    ): 'Success' | 'NoCallbacksFound' => {
        if (!callbackResult || !callbacks) return 'NoCallbacksFound';
        for (const key in callbacks) {
            if (key === callbackResult.requestID) {
                callbacks[key].callback(callbackResult);
                delete callbacks[key];
                return 'Success';
            }
        }

        return 'NoCallbacksFound';
    };

    protected static logNoCallbacksWarning = (response: WebSocketResponse): void => {
        console.warn(
            'Received a Handshake Response that did not match a callback.' +
                'This is the content of the response: \n Response ID: ' +
                response.requestID +
                '\n Status: ' +
                response.status +
                '\n Message: ' +
                response.message +
                '\n Original request - ' +
                response.originalRequest
        );
    };
}
