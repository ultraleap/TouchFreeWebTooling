import { BaseMessageReceiver } from './BaseMessageReceiver';
import { ActionCode, CallbackHandler, ConfigState } from '_internal';

/**
 * Receives configuration state messages from the service and distributes them
 *
 * @internal
 */
export class ConfigStateMessageReceiver extends BaseMessageReceiver<ConfigState> {
    /**
     * The {@link ActionCode | ActionCodes} that are handled by this message receiver
     */
    public readonly actionCode: ActionCode[] = [
        ActionCode.CONFIGURATION_STATE,
        ActionCode.CONFIGURATION_FILE_STATE,
        ActionCode.QUICK_SETUP_CONFIG,
    ];

    /**
     * Sets up consuming messages from a queue and passing them to the callbacks
     */
    constructor(callbackHandler: CallbackHandler) {
        super(true);
        this.setup(() => this.checkForState(callbackHandler));
    }

    /**
     * Checks {@link queue} for a single {@link configState} and handles it.
     */
    checkForState = (callbackHandler: CallbackHandler): void => {
        const configState: ConfigState | undefined = this.queue.shift();

        if (configState) {
            const configResult = BaseMessageReceiver.handleCallbackList(
                configState,
                callbackHandler.configStateCallbacks
            );
            switch (configResult) {
                case 'NoCallbacksFound':
                    console.warn('Received a ConfigState message that did not match a callback.');
                    break;
                case 'Success':
                    // no-op
                    break;
            }
        }
    };
}
