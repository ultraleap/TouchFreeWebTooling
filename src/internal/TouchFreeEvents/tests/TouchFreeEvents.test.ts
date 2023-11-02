import * as ConnectionApi from '../../Connection/ConnectionApi';
import { init } from '../../Initialization/Initialization';
import {
    type TouchFreeEventSignatures,
    registerEventCallback,
    dispatchEventCallback,
    type TouchFreeEvent,
} from '../TouchFreeEvents';

const events: TouchFreeEventSignatures = {
    onConnected: vi.fn(),
    whenConnected: vi.fn(),
    onServiceStatusChange: vi.fn(),
    onTrackingServiceStateChange: vi.fn(),
    handFound: vi.fn(),
    handsLost: vi.fn(),
    inputAction: vi.fn(),
    transmitHandData: vi.fn(),
    transmitInputAction: vi.fn(),
    transmitInputActionRaw: vi.fn(),
    handEntered: vi.fn(),
    handExited: vi.fn(),
    onLicenseStateChange: vi.fn(),
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
                const mock = vi.spyOn(ConnectionApi, 'isConnected').mockReturnValue(true);
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
