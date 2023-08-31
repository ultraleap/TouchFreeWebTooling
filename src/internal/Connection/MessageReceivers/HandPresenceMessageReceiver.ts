import { ActionCode } from '../ActionCode';
import { HandPresenceState } from '../ConnectionTypes';
import { ServiceConnection } from '../ServiceConnection';
import { BaseMessageReceiver } from './BaseMessageReceiver';

/**
 * Receives hand presence messages from the service and distributes them
 *
 * @internal
 */
export class HandPresenceMessageReceiver extends BaseMessageReceiver<{ state: HandPresenceState }> {
    /**
     * The {@link ActionCode | ActionCodes} that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.HAND_PRESENCE_EVENT];

    private readonly serviceConnection: ServiceConnection;

    /**
     * Sets up consuming hand presence messages and sending them to the {@link ConnectionManager}
     */
    constructor(serviceConnection: ServiceConnection) {
        super(false);
        this.serviceConnection = serviceConnection;
        this.setup(() => this.checkForState());
    }

    /**
     * Checks the latest message and processes it if it has not been processed yet
     */
    checkForState = () => {
        if (this.lastItem?.state !== undefined && this.lastItem?.state !== HandPresenceState.PROCESSED) {
            this.serviceConnection.handleHandPresenceEvent(this.lastItem.state);
            this.lastItem.state = HandPresenceState.PROCESSED;
        }
    };
}
