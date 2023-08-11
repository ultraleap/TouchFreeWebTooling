import { ConnectionManager } from '../ConnectionManager';
import {
    ActionCode,
    CommunicationWrapper,
    EventUpdate,
    InteractionZoneEvent,
    InteractionZoneState,
} from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

export class InteractionZoneMessageReceiver extends BaseMessageReceiver<EventUpdate<InteractionZoneState>> {
    public readonly actionCode: ActionCode[] = [ActionCode.INTERACTION_ZONE_EVENT];

    constructor() {
        super(false);
        this.setup(() => this.CheckForState());
    }

    override ReceiveMessage = (message: CommunicationWrapper<unknown>) => {
        const { state } = message.content as InteractionZoneEvent;
        this.lastItem = { status: 'UNPROCESSED', state: state };
    };

    CheckForState = () => {
        if (this.lastItem?.status === 'UNPROCESSED') {
            ConnectionManager.HandleInteractionZoneEvent(this.lastItem.state);
            this.lastItem.status = 'PROCESSED';
        }
    };
}
