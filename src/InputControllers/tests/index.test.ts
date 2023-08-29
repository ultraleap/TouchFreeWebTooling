import { WebInputController, getInputController, init } from 'TouchFree';

describe('InputController', () => {
    test('getInputController should get the input controller correctly', () => {
        init();
        const controller = getInputController();
        expect(controller instanceof WebInputController).toBe(true);
    });
});
