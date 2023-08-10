import { ConnectionManager } from '../ConnectionManager';
import { ActionCode, HandPresenceState } from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

export class HandPresenceMessageReceiver extends BaseMessageReceiver<{ state: HandPresenceState }> {
    public readonly actionCode: ActionCode[] = [ActionCode.HAND_PRESENCE_EVENT];

    constructor() {
        super(false);
        this.setup(() => this.CheckForState());
    }

    CheckForState = () => {
        if (this.lastItem?.state !== undefined && this.lastItem?.state !== HandPresenceState.PROCESSED) {
            ConnectionManager.HandleHandPresenceEvent(this.lastItem.state);
            this.lastItem.state = HandPresenceState.PROCESSED;
        }
    };
}
