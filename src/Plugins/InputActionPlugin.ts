import { TouchFreeInputAction } from '../TouchFreeToolingTypes';

/**
 * Base class for input action plugins
 * @remarks
 * The `InputActionManager` runs each plugin upon receiving a message
 * from the service before dispatching an InputAction event.
 * Input action plugins invoke a `"InputActionOutput"` event on themselves
 * for subscribers to listen to if the results of a specific plugin is required.
 * @public
 */
export abstract class InputActionPlugin extends EventTarget {
    /**
     * Run this plugin, modifying the `InputAction` and dispatching an `"InputActionOutput"` event from this plugin
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
     * For derived classes to invoke the `InputActionOutput` event.
     * @param inputAction - InputAction state to dispatch event with
     *
     * @internal
     */
    transmitInputAction(inputAction: TouchFreeInputAction): void {
        const inputActionEvent = new CustomEvent<TouchFreeInputAction>('InputActionOutput', { detail: inputAction });
        this.dispatchEvent(inputActionEvent);
    }
}
