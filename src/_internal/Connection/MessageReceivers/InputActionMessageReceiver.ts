import { InputActionManager, InputType, TouchFreeInputAction } from 'TouchFree';

import { BaseMessageReceiver } from './BaseMessageReceiver';
import { ActionCode, BitmaskFlags, WebsocketInputAction, convertInputAction } from '_internal';

/**
 * Receives input action messages from the service and distributes them
 *
 * @internal
 */
export class InputActionMessageReceiver extends BaseMessageReceiver<WebsocketInputAction> {
    /**
     * The {@link ActionCode | ActionCodes} that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [ActionCode.INPUT_ACTION];

    /**
     * Sets up consuming messages from the queue and passing them to the {@link InputActionManager}
     */
    constructor() {
        super(true);
        this.setup(() => this.checkForState());
    }

    /**
     * How many non-essential {@link TouchFreeInputAction}s should the {@link queue}
     * be trimmed *to* per frame. This is used to ensure the Tooling can keep up with the
     * Events sent over the WebSocket.
     */
    actionCullToCount = 2;

    /**
     * Used to ensure UP events are sent at the correct position relative to the previous MOVE event.
     * This is required due to the culling of events from the {@link actionQueue} in {@link CheckForAction}.
     */
    lastKnownCursorPosition: Array<number> = [0, 0];

    /**
     * Checks {@link queue} for a single {@link TouchFreeInputAction} and handles it.
     *
     * @remarks
     * If there are too many in the queue, clears out non-essential {@link TouchFreeInputAction}
     * down to the number specified by {@link actionCullToCount}.
     * If any remain, sends the oldest {@link TouchFreeInputAction} to {@link InputActionManager}
     * to handle the action. Actions with UP {@link InputType} have their positions set to
     * {@link lastKnownCursorPosition} to ensure input events trigger correctly.
     */
    checkForState = (): void => {
        while (this.queue.length > this.actionCullToCount) {
            if (this.queue[0] !== undefined) {
                // Stop shrinking the queue if we have a 'key' input event
                if (
                    this.queue[0].InteractionFlags & BitmaskFlags.MOVE ||
                    this.queue[0].InteractionFlags & BitmaskFlags.NONE_INPUT
                ) {
                    // We want to ignore non-move results
                    this.queue.shift();
                } else {
                    break;
                }
            }
        }

        const action: WebsocketInputAction | undefined = this.queue.shift();

        if (action !== undefined) {
            // Parse newly received messages & distribute them
            const converted: TouchFreeInputAction = convertInputAction(action);

            //Cache or use the lastKnownCursorPosition. Copy the array to ensure it is not a reference
            if (converted.InputType !== InputType.UP) {
                this.lastKnownCursorPosition = [...converted.CursorPosition];
            } else {
                converted.CursorPosition = [...this.lastKnownCursorPosition];
            }

            // Wrapping the function in a timeout of 0 seconds allows the dispatch to be asynchronous
            setTimeout(() => {
                InputActionManager.handleInputAction(converted);
            });
        }
    };
}
