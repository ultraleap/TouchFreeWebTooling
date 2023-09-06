import { ActionCode } from '../ActionCode';
import { HandPresenceState } from '../ConnectionTypes';
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

    /**
     * Sets up consuming hand presence messages and sending them to the {@link ConnectionManager}
     */
    constructor(callback: (state: HandPresenceState) => void) {
        super(false);
        this.setup(() => this.checkForState(callback));
    }

    /**
     * Checks the latest message and processes it if it has not been processed yet
     */
    checkForState = (callback: (state: HandPresenceState) => void) => {
        if (this.lastItem?.state !== undefined && this.lastItem?.state !== HandPresenceState.PROCESSED) {
            callback(this.lastItem.state);
            this.lastItem.state = HandPresenceState.PROCESSED;
        }
    };
}
