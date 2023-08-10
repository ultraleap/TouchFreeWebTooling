import TouchFree from '../../TouchFree';
import { CallbackHandler } from '../CallbackHandler';
import { ActionCode, ServiceStatus } from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

export class ServiceStateMessageReceiver extends BaseMessageReceiver<ServiceStatus> {
    public readonly actionCode: ActionCode[] = [ActionCode.SERVICE_STATUS];
    constructor(callbackHandler: CallbackHandler) {
        super(true);
        this.setup(() => this.CheckForState(callbackHandler));
    }

    // Function: CheckForServiceStatus
    // Used to check the <serviceStatusQueue> for a <ServiceStatus>. Sends it to <HandleCallbackList> with
    // the <serviceStatusCallbacks> dictionary if there is one.
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
