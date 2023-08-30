import { EventHandle, InputType, TouchFreeInputAction, registerEventCallback } from '../index';

/**
 * Converts {@link TouchFreeInputAction | TouchFreeInputActions} into inputs for specific environments.
 *
 * @remarks
 * This base class handles subscribing to the TouchFree `'transmitInputAction'` event.
 * Override {@link handleInputAction} in subclasses to implement specific behaviour.
 * @public
 */
export abstract class BaseInputController {
    private static instantiated = false;
    private handleInputActionCallback: EventHandle | undefined;

    /**
     * Subscribes to the TouchFree `'transmitInputAction'` event, invoke {@link handleInputAction}
     * with {@link TouchFreeInputAction | TouchFreeInputActions} as they are received.
     *
     * @remarks
     * Calling this constructor more than once without {@link disconnect}ing the previous
     * is a no-op - only one `InputController` can be initialized at one time.
     */
    constructor() {
        if (!BaseInputController.instantiated) {
            BaseInputController.instantiated = true;
            this.handleInputActionCallback = registerEventCallback(
                'transmitInputAction',
                this.handleInputAction.bind(this)
            );
        }
    }

    /**
     * Override to implement InputController specific behaviour for
     * {@link TouchFreeInputAction  | TouchFreeInputActions}
     * @param inputData - The latest input action received from TouchFree Service.
     */
    protected handleInputAction(inputData: TouchFreeInputAction): void {
        switch (inputData.InputType) {
            case InputType.MOVE:
                break;

            case InputType.DOWN:
                break;

            case InputType.UP:
                break;

            case InputType.CANCEL:
                break;
        }
    }

    /**
     * Un-registers the event callback and resets initialization state.
     *
     * @remarks
     * Must be called before constructing another `InputController` when
     * switching. Only one can be active at a time.
     */
    disconnect() {
        this.handleInputActionCallback?.unregisterEventCallback();
        BaseInputController.instantiated = false;
    }
}
