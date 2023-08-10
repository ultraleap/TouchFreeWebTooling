import { CallbackHandler } from '../CallbackHandler';
import { ActionCode, ConfigState } from '../TouchFreeServiceTypes';
import { BaseMessageReceiver } from './BaseMessageReceiver';

export class ConfigStateMessageReceiver extends BaseMessageReceiver<ConfigState> {
    public readonly actionCode: ActionCode[] = [
        ActionCode.CONFIGURATION_STATE,
        ActionCode.CONFIGURATION_FILE_STATE,
        ActionCode.QUICK_SETUP_CONFIG,
    ];
    constructor(callbackHandler: CallbackHandler) {
        super(true);
        this.setup(() => this.CheckForState(callbackHandler));
    }

    // Function: CheckForState
    // Used to check the <configStateQueue> for a <ConfigState>. Sends it to <HandleCallbackList> with
    // the <configStateCallbacks> dictionary if there is one.
    CheckForState(callbackHandler: CallbackHandler): void {
        const configState: ConfigState | undefined = this.queue.shift();

        if (configState) {
            const configResult = BaseMessageReceiver.HandleCallbackList(
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
    }
}
