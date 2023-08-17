import TouchFree from '../../TouchFree';
import { CallbackHandler } from '../CallbackHandler';
import { ActionCode, ServiceStatus } from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

/**
 * Receives service state messages from the service and distributes them
 *
 * @internal
 */
export class ServiceStateMessageReceiver extends BaseMessageReceiver<ServiceStatus> {
    /**
     * The {@link ActionCode}s that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.SERVICE_STATUS];

    /**
     * Sets up consuming messages from a queue and passing them to the callbacks
     */
    constructor(callbackHandler: CallbackHandler) {
        super(true);
        this.setup(() => this.CheckForState(callbackHandler));
    }

    /**
     * Checks {@link queue} for a single {@link ServiceStatus} and handles it.
     */
    CheckForState = (callbackHandler: CallbackHandler): void => {
        const serviceStatus: ServiceStatus | undefined = this.queue.shift();

        if (serviceStatus) {
            const callbackResult = BaseMessageReceiver.HandleCallbackList(
                serviceStatus,
                callbackHandler.serviceStatusCallbacks
            );

            switch (callbackResult) {
                // If callback didn't happen for known reasons, we can be sure it's an independent status event rather
                // than a request response
                // TODO: Send/handle this request from service differently from normal response so
                // we can be sure it's an independent event
                case 'NoCallbacksFound':
                    // If service state is null we didn't get info about it from this message
                    if (serviceStatus.trackingServiceState !== null) {
                        TouchFree.DispatchEvent('OnTrackingServiceStateChange', serviceStatus.trackingServiceState);
                    }

                    TouchFree.DispatchEvent('OnServiceStatusChange', serviceStatus);
                    break;
                case 'Success':
                    // no-op
                    break;
            }
        }
    };
}
