import { init } from '../../Initialization/Initialization';
import { getInputController } from '../CurrentInputController';
import { WebInputController } from '../WebInputController';

describe('InputController', () => {
    test('getInputController should get the input controller correctly', () => {
        init();
        const controller = getInputController();
        expect(controller instanceof WebInputController).toBe(true);
    });
});
