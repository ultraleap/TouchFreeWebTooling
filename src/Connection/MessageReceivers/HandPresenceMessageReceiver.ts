import { ConnectionManager } from '../ConnectionManager';
import { ActionCode, HandPresenceState } from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

/**
 * Receives hand presence messages from the service and distributes them
 *
 * @internal
 */
export class HandPresenceMessageReceiver extends BaseMessageReceiver<{ state: HandPresenceState }> {
    /**
     * The {@link ActionCode}s that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.HAND_PRESENCE_EVENT];

    /**
     * Sets up consuming hand presence messages and sending them to the {@link ConnectionManager}
     */
    constructor() {
        super(false);
        this.setup(() => this.CheckForState());
    }

    /**
     * Checks the latest message and processes it if it has not been processed yet
     */
    CheckForState = () => {
        if (this.lastItem?.state !== undefined && this.lastItem?.state !== HandPresenceState.PROCESSED) {
            ConnectionManager.HandleHandPresenceEvent(this.lastItem.state);
            this.lastItem.state = HandPresenceState.PROCESSED;
        }
    };
}
