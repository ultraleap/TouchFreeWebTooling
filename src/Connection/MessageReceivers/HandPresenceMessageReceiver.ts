import { ConnectionManager } from '../ConnectionManager';
import { ActionCode, HandPresenceState } from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

export class HandPresenceMessageReceiver extends BaseMessageReceiver<HandPresenceState> {
    public readonly actionCode: ActionCode[] = [ActionCode.HAND_PRESENCE_EVENT];

    constructor() {
        super(false);
        this.setup(() => this.CheckForState());
    }

    CheckForState = () => {
        if (this.lastItem !== undefined && this.lastItem !== HandPresenceState.PROCESSED) {
            ConnectionManager.HandleHandPresenceEvent(this.lastItem);
            this.lastItem = HandPresenceState.PROCESSED;
        }
    };
}
