import { TouchFreeInputAction } from '../index';

/**
 * Base class for input action plugins
 * @remarks
 * The `InputActionManager` runs each plugin upon receiving a message
 * from the service before dispatching an inputAction event.
 * Input action plugins invoke a `"inputActionOutput"` event on themselves
 * for subscribers to listen to if the results of a specific plugin is required.
 * @public
 */
export abstract class InputActionPlugin extends EventTarget {
    /**
     * Run this plugin, modifying the `inputAction` and dispatching an `"inputActionOutput"` event from this plugin
     * @param inputAction - Input action input
     * @returns Modified input action
     */
    runPlugin(inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
        const modifiedInputAction = this.modifyInputAction(inputAction);

        if (modifiedInputAction != null) {
            this.transmitInputAction(modifiedInputAction);
        }

        return modifiedInputAction;
    }

    /**
     * Proxy function for derived classes to modify input actions before they are dispatched.
     *
     * @internal
     */
    modifyInputAction(inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
        return inputAction;
    }

    /**
     * For derived classes to invoke the `inputActionOutput` event.
     * @param inputAction - inputAction state to dispatch event with
     *
     * @internal
     */
    transmitInputAction(inputAction: TouchFreeInputAction): void {
        const inputActionEvent = new CustomEvent<TouchFreeInputAction>('inputActionOutput', { detail: inputAction });
        this.dispatchEvent(inputActionEvent);
    }
}
