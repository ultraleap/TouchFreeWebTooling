import { registerEventCallback } from '../../TouchFreeEvents/TouchFreeEvents';
import {
    createInputAction,
    mockTfPluginInputAction,
    mockTfPluginPartialInputAction,
    copyInputAction,
    checkTwoInputActionsAreSame,
    sleep,
} from '../../tests/testUtils';
import { type TouchFreeInputAction, InteractionType, HandType, HandChirality, InputType } from '../InputAction';
import { InputActionManager } from '../InputActionManager';
import { InputActionPlugin } from '../InputActionPlugin';

describe('InputActionManager', () => {
    test('Check plugin gets called with the correct data', () => {
        let currentInputAction: TouchFreeInputAction;
        let currentModifiedAction: TouchFreeInputAction;
        let pluginCallCount = 0;

        class MockPlugin extends InputActionPlugin {
            override runPlugin(inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
                expect(inputAction).toStrictEqual(currentInputAction);
                const modifiedInputAction = super.runPlugin(inputAction);
                expect(modifiedInputAction).toStrictEqual(currentModifiedAction);
                pluginCallCount++;
                return modifiedInputAction;
            }

            override modifyInputAction(inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
                currentModifiedAction = { ...inputAction, Timestamp: Date.now() };
                return currentModifiedAction;
            }

            override transmitInputAction(inputAction: TouchFreeInputAction): void {
                expect(inputAction).toStrictEqual(currentModifiedAction);
            }
        }
        InputActionManager.setPlugins([new MockPlugin()]);
        expect(pluginCallCount).toBe(0);
        currentInputAction = createInputAction();
        mockTfPluginInputAction(currentInputAction);
        expect(pluginCallCount).toBe(1);

        currentInputAction = {
            Timestamp: 477777,
            InteractionType: InteractionType.TOUCHPLANE,
            HandType: HandType.SECONDARY,
            Chirality: HandChirality.RIGHT,
            InputType: InputType.DOWN,
            CursorPosition: [332, 455],
            DistanceFromScreen: 20,
            ProgressToClick: 80,
        };
        mockTfPluginInputAction(currentInputAction);
        expect(pluginCallCount).toBe(2);
    });

    test('Check plugins get called in the correct order', () => {
        let pluginCallCount = 0;

        class MockOrderPlugin extends InputActionPlugin {
            private orderNumber: number;

            constructor(orderNumber: number) {
                super();
                this.orderNumber = orderNumber;
            }

            override runPlugin(inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
                expect(pluginCallCount).toBe(this.orderNumber);
                pluginCallCount++;
                return inputAction;
            }
        }

        InputActionManager.setPlugins([
            new MockOrderPlugin(0),
            new MockOrderPlugin(1),
            new MockOrderPlugin(2),
            new MockOrderPlugin(3),
        ]);
        expect(pluginCallCount).toBe(0);
        mockTfPluginPartialInputAction();
        expect(pluginCallCount).toBe(4);
    });

    test('Check InputActionPlugin methods', async () => {
        let callCount = 0;
        let passed = false;

        class MockCallSuperPlugin extends InputActionPlugin {
            override runPlugin(inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
                callCount++;
                const copy = copyInputAction(inputAction);
                const returnedInputAction = super.runPlugin(copy);
                checkTwoInputActionsAreSame(inputAction, returnedInputAction);

                return returnedInputAction;
            }

            override modifyInputAction(inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
                callCount++;
                const copy = copyInputAction(inputAction);
                const returnInputAction = super.modifyInputAction(copy);

                checkTwoInputActionsAreSame(inputAction, returnInputAction);

                return inputAction;
            }

            override transmitInputAction(inputAction: TouchFreeInputAction): void {
                callCount++;
                this.addEventListener('inputActionOutput', (event) => {
                    const actionEvent = event as CustomEvent<TouchFreeInputAction>;
                    const action = actionEvent.detail;

                    if (checkTwoInputActionsAreSame(action, currentInputAction)) {
                        passed = true;
                    }
                });

                const copy = copyInputAction(inputAction);
                super.transmitInputAction(copy);
            }
        }

        InputActionManager.setPlugins([new MockCallSuperPlugin()]);
        expect(callCount).toBe(0);
        const currentInputAction = createInputAction();
        mockTfPluginInputAction(currentInputAction);
        expect(callCount).toBe(3);

        await sleep(1000);
        expect(passed).toBeTruthy();
    });

    test('Check plugin can return null', async () => {
        let pluginCallCount = 0;
        let nulledInputAction: TouchFreeInputAction;

        class MockNullPlugin extends InputActionPlugin {
            override runPlugin(inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
                // Store the nulled input action to check against later
                nulledInputAction = inputAction;
                pluginCallCount++;
                return null;
            }
        }

        InputActionManager.setPlugins([new MockNullPlugin()]);

        let failed = false;
        registerEventCallback('transmitInputAction', (inputAction) => {
            // Fail if we receive the nulled input action
            failed = inputAction === nulledInputAction;
        });

        expect(pluginCallCount).toBe(0);
        mockTfPluginPartialInputAction();
        expect(pluginCallCount).toBe(1);

        await sleep(1000);
        expect(failed).toBeFalsy();
    });
});
