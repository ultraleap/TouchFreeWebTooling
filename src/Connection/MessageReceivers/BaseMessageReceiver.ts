import {
    ActionCode,
    CallbackList,
    CommunicationWrapper,
    TouchFreeRequest,
    TouchFreeRequestCallback,
    TrackingStateResponse,
    WebSocketResponse,
} from '../TouchFreeServiceTypes';

export abstract class BaseMessageReceiver<TMessage> {
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
        const wsInput = message.content as TMessage;
        if (this.useQueue) {
            this.queue.push(wsInput);
        } else {
            this.lastItem = wsInput;
        }
    };

    // Function: CheckQueue
    // Gets the next response in a given queue and handles the callback if present.
    protected CheckQueue<T extends WebSocketResponse | TrackingStateResponse>(
        queue: T[],
        callbacks: CallbackList<T>
    ): void {
        const response = queue.shift();

        if (!response || !callbacks) return;

        for (const key in callbacks) {
            if (key === response.requestID) {
                callbacks[key].callback(response);
                delete callbacks[key];
                return;
            }
        }
    }

    // Function: HandleCallbackList
    // Checks the dictionary of <callbacks> for a matching request ID. If there is a
    // match, calls the callback action in the matching <TouchFreeRequestCallback>.
    // Returns true if it was able to find a callback, returns false if not
    protected static HandleCallbackList<T extends WebSocketResponse | TouchFreeRequest>(
        callbackResult?: T,
        callbacks?: CallbackList<T>
    ): 'Success' | 'NoCallbacksFound' {
        if (!callbackResult || !callbacks) return 'NoCallbacksFound';
        for (const key in callbacks) {
            if (key === callbackResult.requestID) {
                callbacks[key].callback(callbackResult);
                delete callbacks[key];
                return 'Success';
            }
        }

        return 'NoCallbacksFound';
    }

    protected static LogNoCallbacksWarning(response: WebSocketResponse): void {
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
    }

    protected static ClearUnresponsiveItems<T>(
        lastClearTime: number,
        callbacks: { [id: string]: TouchFreeRequestCallback<T> }
    ) {
        if (callbacks !== undefined) {
            for (const key in callbacks) {
                if (callbacks[key].timestamp < lastClearTime) {
                    delete callbacks[key];
                } else {
                    break;
                }
            }
        }
    }
}
