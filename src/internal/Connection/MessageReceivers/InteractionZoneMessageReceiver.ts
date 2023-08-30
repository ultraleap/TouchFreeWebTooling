import { ActionCode } from '../ActionCode';
import { ConnectionManager } from '../ConnectionManager';
import { InteractionZoneState } from '../ConnectionTypes';
import { EventUpdate, CommunicationWrapper, InteractionZoneEvent } from '../ServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

/**
 * Receives interaction zone messages from the service and distributes them
 *
 * @internal
 */
export class InteractionZoneMessageReceiver extends BaseMessageReceiver<EventUpdate<InteractionZoneState>> {
    /**
     * The {@link ActionCode | ActionCodes} that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.INTERACTION_ZONE_EVENT];

    /**
     * Sets up consuming interaction zone messages and sending them to the {@link ConnectionManager}
     */
    constructor() {
        super(false);
        this.setup(() => this.checkForState());
    }

    /**
     * Handles processing the message from the service into a consumable format
     *
     * @param message - The message received from the Service
     */
    override receiveMessage = (message: CommunicationWrapper<unknown>) => {
        const { state } = message.content as InteractionZoneEvent;
        this.lastItem = { status: 'UNPROCESSED', state: state };
    };

    /**
     * Checks the latest message and processes it if it has not been processed yet
     */
    checkForState = () => {
        if (this.lastItem?.status === 'UNPROCESSED') {
            ConnectionManager.handleInteractionZoneEvent(this.lastItem.state);
            this.lastItem.status = 'PROCESSED';
        }
    };
}
