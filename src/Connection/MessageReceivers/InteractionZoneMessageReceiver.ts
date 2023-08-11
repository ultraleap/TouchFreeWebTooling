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
    /**
     * The {@link ActionCode}s that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.INTERACTION_ZONE_EVENT];

    /**
     * Sets up consuming interaction zone messages and sending them to the {@link ConnectionManager}
     */
    constructor() {
        super(false);
        this.setup(() => this.CheckForState());
    }

    /**
     * Handles processing the message from the service into a consumable format
     * 
     * @param message The message received from the Service
     */
    override ReceiveMessage = (message: CommunicationWrapper<unknown>) => {
        const { state } = message.content as InteractionZoneEvent;
        this.lastItem = { status: 'UNPROCESSED', state: state };
    };

    /**
     * Checks the latest message and processes it if it has not been processed yet
     */
    CheckForState = () => {
        if (this.lastItem?.status === 'UNPROCESSED') {
            ConnectionManager.HandleInteractionZoneEvent(this.lastItem.state);
            this.lastItem.status = 'PROCESSED';
        }
    };
}
