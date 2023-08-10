import {
    ActionCode,
    CallbackList,
    CommunicationWrapper,
    TouchFreeRequest,
    TouchFreeRequestCallback,
    WebSocketResponse,
} from '../TouchFreeServiceTypes';
import { IBaseMessageReceiver } from './IBaseMessageReceiver';

export abstract class BaseMessageReceiver<TMessage> implements IBaseMessageReceiver {
    constructor(useQueue: boolean) {
        this.useQueue = useQueue;
    }

    public abstract readonly actionCode: ActionCode[];

    useQueue: boolean;

    // Variable: updateRate
    // Note: this is duplicated in the HandDataMessageReceiver
    // How many times per second to process <WebSocketResponse> & <TouchFreeInputActions>
    updateRate = 60;

    // Calculated on construction for use in setting the update interval
    private updateDuration: number = (1 / this.updateRate) * 1000;

    setup = (checkQueue: TimerHandler) => {
        setInterval(checkQueue, this.updateDuration);
    };

    protected queue: TMessage[] = [];
    protected lastItem: TMessage | undefined;

    ReceiveMessage = (message: CommunicationWrapper<unknown>) => {
        const messageContent = message.content as TMessage;
        if (this.useQueue) {
            this.queue.push(messageContent);
        } else {
            this.lastItem = messageContent;
        }
    };

    // Function: CheckQueue
    // Gets the next response in a given queue and handles the callback if present.
    protected CheckQueue = <T extends TouchFreeRequest>(queue: T[], callbacks: CallbackList<T>) => {
        const response = queue.shift();
        BaseMessageReceiver.HandleCallbackList(response, callbacks);
    };

    // Function: HandleCallbackList
    // Checks the dictionary of <callbacks> for a matching request ID. If there is a
    // match, calls the callback action in the matching <TouchFreeRequestCallback>.
    // Returns true if it was able to find a callback, returns false if not
    protected static HandleCallbackList = <T extends TouchFreeRequest>(
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

    protected static LogNoCallbacksWarning = (response: WebSocketResponse): void => {
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

    protected static ClearUnresponsiveItems = <T>(
        lastClearTime: number,
        callbacks: { [id: string]: TouchFreeRequestCallback<T> }
    ) => {
        if (callbacks !== undefined) {
            for (const key in callbacks) {
                if (callbacks[key].timestamp < lastClearTime) {
                    delete callbacks[key];
                } else {
                    break;
                }
            }
        }
    };
}
