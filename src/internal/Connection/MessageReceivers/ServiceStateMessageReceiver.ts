import { dispatchEventCallback } from '../../TouchFreeEvents/TouchFreeEvents';
import { ActionCode } from '../ActionCode';
import { CallbackList } from '../CallbackLists';
import { ServiceStateResponse, convertResponseToServiceState } from '../RequestTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

/**
 * Receives service state messages from the service and distributes them
 *
 * @internal
 */
export class ServiceStateMessageReceiver extends BaseMessageReceiver<ServiceStateResponse> {
    /**
     * The {@link ActionCode | ActionCodes} that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.SERVICE_STATUS];

    /**
     * Sets up consuming messages from a queue and passing them to the callbacks
     */
    constructor(callbackList: CallbackList<ServiceStateResponse>) {
        super(true);
        this.setup(() => this.checkForState(callbackList));
    }

    /**
     * Checks {@link queue} for a single {@link ServiceStateResponse} and handles it.
     */
    checkForState = (callbackList: CallbackList<ServiceStateResponse>): void => {
        const serviceStatus: ServiceStateResponse | undefined = this.queue.shift();

        if (serviceStatus) {
            const callbackResult = BaseMessageReceiver.handleCallbackList(serviceStatus, callbackList);

            switch (callbackResult) {
                // If callback didn't happen for known reasons, we can be sure it's an independent status event rather
                // than a request response
                // TODO: Send/handle this request from service differently from normal response so
                // we can be sure it's an independent event
                case 'NoCallbacksFound':
                    // If service state is null we didn't get info about it from this message
                    if (serviceStatus.trackingServiceState !== null) {
                        dispatchEventCallback('onTrackingServiceStateChange', serviceStatus.trackingServiceState);
                    }

                    dispatchEventCallback('onServiceStatusChange', convertResponseToServiceState(serviceStatus));
                    break;
                case 'Success':
                    // no-op
                    break;
            }
        }
    };
}
