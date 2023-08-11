import TouchFree from '../../TouchFree';
import { HandChirality, HandType, InputType, InteractionType, TouchFreeInputAction } from '../../TouchFreeToolingTypes';
import {
    createInputAction,
    mockTfPluginPartialInputAction,
    mockTfPluginInputAction,
    sleep,
    checkTwoInputActionsAreSame,
    copyInputAction,
} from '../../tests/testUtils';
import { InputActionManager } from '../InputActionManager';
import { InputActionPlugin } from '../InputActionPlugin';

describe('InputActionManager', () => {
    test('Check plugin gets called with the correct data', () => {
        let currentInputAction: TouchFreeInputAction;
        let currentModifiedAction: TouchFreeInputAction;
        let pluginCallCount = 0;

        class MockPlugin extends InputActionPlugin {
            override RunPlugin(inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
                expect(inputAction).toStrictEqual(currentInputAction);
                const modifiedInputAction = super.RunPlugin(inputAction);
                expect(modifiedInputAction).toStrictEqual(currentModifiedAction);
                pluginCallCount++;
                return modifiedInputAction;
            }

            override ModifyInputAction(inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
                currentModifiedAction = { ...inputAction, Timestamp: Date.now() };
                return currentModifiedAction;
            }

            override TransmitInputAction(inputAction: TouchFreeInputAction): void {
                expect(inputAction).toStrictEqual(currentModifiedAction);
            }
        }
        InputActionManager.SetPlugins([new MockPlugin()]);
        expect(pluginCallCount).toBe(0);
        currentInputAction = createInputAction();
        mockTfPluginInputAction(currentInputAction);
        expect(pluginCallCount).toBe(1);

        currentInputAction = new TouchFreeInputAction(
            477777,
            InteractionType.TOUCHPLANE,
            HandType.SECONDARY,
            HandChirality.RIGHT,
            InputType.DOWN,
            [332, 455],
            20,
            80
        );
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

            override RunPlugin(inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
                expect(pluginCallCount).toBe(this.orderNumber);
                pluginCallCount++;
                return inputAction;
            }
        }

        InputActionManager.SetPlugins([
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
            override RunPlugin(_inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
                callCount++;
                const copy = copyInputAction(_inputAction);
                const returnedInputAction = super.RunPlugin(copy);
                checkTwoInputActionsAreSame(_inputAction, returnedInputAction);

                return returnedInputAction;
            }

            override ModifyInputAction(_inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
                callCount++;
                const copy = copyInputAction(_inputAction);
                const returnInputAction = super.ModifyInputAction(copy);

                checkTwoInputActionsAreSame(_inputAction, returnInputAction);

                return _inputAction;
            }

            override TransmitInputAction(_inputAction: TouchFreeInputAction): void {
                callCount++;
                this.addEventListener('InputActionOutput', (event) => {
                    const actionEvent = event as CustomEvent<TouchFreeInputAction>;
                    const action = actionEvent.detail;

                    if (checkTwoInputActionsAreSame(action, currentInputAction)) {
                        passed = true;
                    }
                });

                const copy = copyInputAction(_inputAction);
                super.TransmitInputAction(copy);
            }
        }

        InputActionManager.SetPlugins([new MockCallSuperPlugin()]);
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
            override RunPlugin(inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
                // Store the nulled input action to check against later
                nulledInputAction = inputAction;
                pluginCallCount++;
                return null;
            }
        }

        InputActionManager.SetPlugins([new MockNullPlugin()]);

        let failed = false;
        TouchFree.RegisterEventCallback('TransmitInputAction', (inputAction) => {
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
