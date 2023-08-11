import { dispatchEvent } from '../TouchFree';
import { TouchFreeInputAction } from '../TouchFreeToolingTypes';
import { InputActionPlugin } from './InputActionPlugin';

/**
 * Manages all `TouchFreeInputAction` events, dispatching a `TransmitInputAction` event for each action received.
 * @remarks
 * Runs `InputAction` data through all `InputActionPlugins` before dispatching.
 * Also dispatches a `TransmitInputActionRaw` event with the `InputAction` data unmodified by any plugins.
 * @public
 */
export class InputActionManager extends EventTarget {
    /**
     * Static global instance of the manager
     */
    static internalInstance: InputActionManager;

    /**
     * Static global array of `InputActionPlugin`
     */
    static plugins: Array<InputActionPlugin> | null = null;

    /**
     * Getter for the global instance. Will initialize if not initialized already.
     */
    public static get instance() {
        if (InputActionManager.internalInstance === undefined) {
            InputActionManager.internalInstance = new InputActionManager();
        }

        return InputActionManager.internalInstance;
    }

    /**
     * Overwrites all plugins with a new array. Plugins will be run in order of the array.
     * @param plugins - Plugin array to assign
     */
    public static setPlugins(plugins: Array<InputActionPlugin>): void {
        this.plugins = plugins;
    }

    /**
     * Handles an `InputAction`, running it through all plugins and dispatching a `"TransmitInputAction"` event
     * @param action - InputAction to handle
     * @internal
     */
    public static handleInputAction(action: TouchFreeInputAction): void {
        dispatchEvent('transmitInputActionRaw', action);

        let newAction = action;

        if (this.plugins !== null) {
            for (let i = 0; i < this.plugins.length; i++) {
                const modifiedAction = this.plugins[i].runPlugin(action);

                if (modifiedAction !== null) {
                    newAction = modifiedAction;
                } else {
                    // The plugin has cancelled the InputAction entirely
                    return;
                }
            }
        }

        // Wrapping the function in a timeout of 0 seconds allows the dispatch to be asynchronous
        setTimeout(() => {
            dispatchEvent('transmitInputAction', newAction);
        }, 0);
    }
}
