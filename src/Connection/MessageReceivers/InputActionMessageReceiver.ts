import { InputActionManager } from '../../Plugins/InputActionManager';
import {
    BitmaskFlags,
    ConvertInputAction,
    InputType,
    TouchFreeInputAction,
    WebsocketInputAction,
} from '../../TouchFreeToolingTypes';
import { ActionCode } from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

export class InputActionMessageReceiver extends BaseMessageReceiver<WebsocketInputAction> {
    public readonly actionCode: ActionCode[] = [ActionCode.INPUT_ACTION];

    constructor() {
        super(true);
        this.setup(() => this.CheckForState());
    }

    // Variable: actionCullToCount
    // How many non-essential <TouchFreeInputActions> should the <actionQueue> be trimmed *to* per
    // frame. This is used to ensure the Tooling can keep up with the Events sent over the
    // WebSocket.
    actionCullToCount = 2;

    // Used to ensure UP events are sent at the correct position relative to the previous
    // MOVE event.
    // This is required due to the culling of events from the actionQueue in CheckForState.
    lastKnownCursorPosition: Array<number> = [0, 0];

    // Function: CheckForState
    // Checks <actionQueue> for valid <TouchFreeInputActions>. If there are too many in the queue,
    // clears out non-essential <TouchFreeInputActions> down to the number specified by
    // <actionCullToCount>. If any remain, sends the oldest <TouchFreeInputAction> to
    // <InputActionManager> to handle the action.
    // UP <InputType>s have their positions set to the last known position to ensure
    // input events trigger correctly.
    CheckForState = (): void => {
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
            const converted: TouchFreeInputAction = ConvertInputAction(action);

            //Cache or use the lastKnownCursorPosition. Copy the array to ensure it is not a reference
            if (converted.InputType !== InputType.UP) {
                this.lastKnownCursorPosition = Array.from(converted.CursorPosition);
            } else {
                converted.CursorPosition = Array.from(this.lastKnownCursorPosition);
            }

            // Wrapping the function in a timeout of 0 seconds allows the dispatch to be asynchronous
            setTimeout(() => {
                InputActionManager.HandleInputAction(converted);
            });
        }
    };
}
