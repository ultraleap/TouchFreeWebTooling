import { ConnectionManager } from '../Connection/ConnectionManager';
import { DotCursor } from '../Cursors/DotCursor';
import { SVGCursor } from '../Cursors/SvgCursor';
import { WebInputController } from '../InputControllers/WebInputController';
import * as TouchFree from '../TouchFree';
import { TouchFreeEventSignatures, TouchFreeEvent } from '../TouchFreeToolingTypes';

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

describe('TouchFree', () => {
    for (const [key, fn] of Object.entries(events)) {
        // No service connection, so testing fall-through functionality of whenConnected instead
        if (key === 'whenConnected') {
            it('Should pass whenConnected callback through to onConnected if there is no current connection', () => {
                TouchFree.registerEventCallback('whenConnected', fn);
                TouchFree.dispatchEvent('onConnected');
                expect(fn).toBeCalledTimes(1);
            });
            it('Should pass whenConnected callback through to onConnected if there is a current connection', () => {
                const mock = jest.spyOn(ConnectionManager, 'isConnected', 'get').mockReturnValue(true);
                TouchFree.registerEventCallback('whenConnected', fn);
                mock.mockRestore();
                expect(fn).toBeCalledTimes(2);
            });
        } else {
            it(`Should trigger appropriate callbacks when ${key} event is dispatched`, () => {
                TouchFree.init();
                const newKey = key as TouchFreeEvent;
                TouchFree.registerEventCallback(newKey, fn);
                TouchFree.dispatchEvent(newKey);
                expect(fn).toBeCalled();
            });
        }
    }

    describe('init', () => {
        const checkDefaultCursor = (initialiseCursor: boolean | undefined) => {
            TouchFree.setCurrentCursor(undefined);
            let cursor = TouchFree.getCurrentCursor();
            expect(cursor).toBe(undefined);
            TouchFree.init({ initialiseCursor: initialiseCursor });
            cursor = TouchFree.getCurrentCursor();
            expect(cursor instanceof SVGCursor).toBe(true);
        };

        it('Should create an SVGCursor when initialiseCursor is undefined', () => checkDefaultCursor(undefined));

        it('Should create an SVGCursor when initialiseCursor is true', () => checkDefaultCursor(true));

        it('Should pass a given address to the ConnectionManager', () => {
            const newAddress = { ip: '192.168.0.1', port: '8080' };
            TouchFree.init({ address: newAddress });
            expect(ConnectionManager.ipAddress).toBe(newAddress.ip);
            expect(ConnectionManager.port).toBe(newAddress.port);
        });
    });

    test('setCurrentCursor should set the cursor correctly', () => {
        const cursor = new SVGCursor();
        TouchFree.setCurrentCursor(cursor);
        expect(TouchFree.getCurrentCursor()).toBe(cursor);

        const newCursor = new DotCursor(new Image(), new Image());
        TouchFree.setCurrentCursor(newCursor);
        expect(TouchFree.getCurrentCursor()).toBe(newCursor);
    });

    test('getInputController should get the input controller correctly', () => {
        TouchFree.init();
        const controller = TouchFree.getInputController();
        expect(controller instanceof WebInputController).toBe(true);
    });
});
