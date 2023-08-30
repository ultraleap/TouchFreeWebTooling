import { ConnectionManager } from '../../Connection/ConnectionManager';
import { init } from '../../Initialization/Initialization';
import {
    TouchFreeEventSignatures,
    registerEventCallback,
    dispatchEventCallback,
    TouchFreeEvent,
} from '../TouchFreeEvents';

const events: TouchFreeEventSignatures = {
    onConnected: jest.fn(),
    whenConnected: jest.fn(),
    onServiceStatusChange: jest.fn(),
    onTrackingServiceStateChange: jest.fn(),
    handFound: jest.fn(),
    handsLost: jest.fn(),
    inputAction: jest.fn(),
    transmitHandData: jest.fn(),
    transmitInputAction: jest.fn(),
    transmitInputActionRaw: jest.fn(),
    handEntered: jest.fn(),
    handExited: jest.fn(),
};

describe('Events', () => {
    for (const [key, fn] of Object.entries(events)) {
        // No service connection, so testing fall-through functionality of whenConnected instead
        if (key === 'whenConnected') {
            it('Should pass whenConnected callback through to onConnected if there is no current connection', () => {
                registerEventCallback('whenConnected', fn);
                dispatchEventCallback('onConnected');
                expect(fn).toBeCalledTimes(1);
            });
            it('Should pass whenConnected callback through to onConnected if there is a current connection', () => {
                const mock = jest.spyOn(ConnectionManager, 'isConnected', 'get').mockReturnValue(true);
                registerEventCallback('whenConnected', fn);
                mock.mockRestore();
                expect(fn).toBeCalledTimes(2);
            });
        } else {
            it(`Should trigger appropriate callbacks when ${key} event is dispatched`, () => {
                init();
                const newKey = key as TouchFreeEvent;
                registerEventCallback(newKey, fn);
                dispatchEventCallback(newKey);
                expect(fn).toBeCalled();
            });
        }
    }
});
