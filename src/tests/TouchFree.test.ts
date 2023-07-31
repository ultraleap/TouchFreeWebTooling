import { ConnectionManager } from '../Connection/ConnectionManager';
import { WebSocketResponse } from '../Connection/TouchFreeServiceTypes';
import { DotCursor } from '../Cursors/DotCursor';
import { SVGCursor } from '../Cursors/SvgCursor';
import { WebInputController } from '../InputControllers/WebInputController';
import TouchFree from '../TouchFree';
import { TouchFreeEventSignatures, TouchFreeEvent } from '../TouchFreeToolingTypes';
import { ServiceConnection } from 'Connection/ServiceConnection';

const events: TouchFreeEventSignatures = {
    OnConnected: jest.fn(),
    WhenConnected: jest.fn(),
    OnServiceStatusChange: jest.fn(),
    OnTrackingServiceStateChange: jest.fn(),
    HandFound: jest.fn(),
    HandsLost: jest.fn(),
    InputAction: jest.fn(),
    TransmitHandData: jest.fn(),
    TransmitInputAction: jest.fn(),
    TransmitInputActionRaw: jest.fn(),
    HandEntered: jest.fn(),
    HandExited: jest.fn(),
};

describe('TouchFree', () => {
    for (const [key, fn] of Object.entries(events)) {
        // No service connection, so testing fall-through functionality of WhenConnected instead
        if (key === 'WhenConnected') {
            it('Should pass WhenConnected callback through to OnConnected if there is no current connection', () => {
                TouchFree.RegisterEventCallback('WhenConnected', fn);
                TouchFree.DispatchEvent('OnConnected');
                expect(fn).toBeCalledTimes(1);
            });
            it('Should pass WhenConnected callback through to OnConnected if there is a current connection', () => {
                const mock = jest.spyOn(ConnectionManager, 'IsConnected', 'get').mockReturnValue(true);
                TouchFree.RegisterEventCallback('WhenConnected', fn);
                mock.mockRestore();
                expect(fn).toBeCalledTimes(2);
            });
        } else {
            it(`Should trigger appropriate callbacks when ${key} event is dispatched`, () => {
                TouchFree.Init();
                const newKey = key as TouchFreeEvent;
                TouchFree.RegisterEventCallback(newKey, fn);
                TouchFree.DispatchEvent(newKey);
                expect(fn).toBeCalled();
            });
        }
    }

    describe('Init', () => {
        const checkDefaultCursor = (initialiseCursor: boolean | undefined) => {
            TouchFree.SetCurrentCursor(undefined);
            let cursor = TouchFree.GetCurrentCursor();
            expect(cursor).toBe(undefined);
            TouchFree.Init({ initialiseCursor: initialiseCursor });
            cursor = TouchFree.GetCurrentCursor();
            expect(cursor instanceof SVGCursor).toBe(true);
        };

        it('Should create an SVGCursor when initialiseCursor is undefined', () => checkDefaultCursor(undefined));

        it('Should create an SVGCursor when initialiseCursor is true', () => checkDefaultCursor(true));

        it('Should pass a given address to the ConnectionManager', () => {
            const newAddress = { ip: '192.168.0.1', port: '8080' };
            TouchFree.Init({ address: newAddress });
            expect(ConnectionManager.iPAddress).toBe(newAddress.ip);
            expect(ConnectionManager.port).toBe(newAddress.port);
        });
    });

    test('SetCurrentCursor should set the cursor correctly', () => {
        const cursor = new SVGCursor();
        TouchFree.SetCurrentCursor(cursor);
        expect(TouchFree.GetCurrentCursor()).toBe(cursor);

        const newCursor = new DotCursor(new Image(), new Image());
        TouchFree.SetCurrentCursor(newCursor);
        expect(TouchFree.GetCurrentCursor()).toBe(newCursor);
    });

    test('GetInputController should get the input controller correctly', () => {
        TouchFree.Init();
        const controller = TouchFree.GetInputController();
        expect(controller instanceof WebInputController).toBe(true);
    });

    describe('ControlAnalyticsSession', () => {
        let serviceConnection: ServiceConnection | null = null;
        const applicationName = 'testApplication';

        beforeAll(() => {
            ConnectionManager.init();
            serviceConnection = ConnectionManager.serviceConnection();
            if (!serviceConnection) fail('Service connection not available');
            jest.spyOn(serviceConnection, 'UpdateAnalyticSessionEvents').mockImplementation(
                (_sessionID, _sessionEvents, callback) => {
                    callback?.(new WebSocketResponse('test', 'Success', 'test', 'test'));
                }
            );
        });

        it('should call AnalyticsSessionRequest with the correct arguments', () => {
            if (!serviceConnection) fail('Service connection not available');
            const testFn = jest
                .spyOn(serviceConnection, 'AnalyticsSessionRequest')
                .mockImplementation((requestType, sessionID, callback) => {
                    expect(sessionID.includes(applicationName)).toBe(true);
                    callback?.(new WebSocketResponse('test', 'Success', 'test', 'test'));
                    return requestType;
                });

            TouchFree.ControlAnalyticsSession('START', applicationName);
            expect(testFn).toReturnWith('START');

            TouchFree.ControlAnalyticsSession('STOP', applicationName);
            expect(testFn).toReturnWith('STOP');
        });

        it('should give appropriate warnings on START', () => {
            if (!serviceConnection) fail('Service connection not available');
            let id = '';

            jest.spyOn(serviceConnection, 'AnalyticsSessionRequest').mockImplementation(
                (_arg1, sessionID, callback) => {
                    id = sessionID;
                    // This callback is here to mimic the Service sending a successful response
                    callback?.(new WebSocketResponse('test', 'Success', 'test', 'test'));
                }
            );
            const testFn = jest.spyOn(console, 'warn').mockImplementation((arg) => {
                expect(arg).toBe(`Session: ${id} already in progress`);
            });

            TouchFree.ControlAnalyticsSession('START', applicationName);
            TouchFree.ControlAnalyticsSession('START', applicationName);
            TouchFree.ControlAnalyticsSession('STOP', applicationName);
            expect(testFn).toBeCalled();
        });

        it('should give appropriate warnings on STOP', () => {
            if (!serviceConnection) fail('Service connection not available');

            jest.spyOn(serviceConnection, 'AnalyticsSessionRequest').mockImplementation(() => {});
            const testFn = jest.spyOn(console, 'warn').mockImplementation((arg) => {
                expect(arg).toBe('No active session');
            });

            TouchFree.ControlAnalyticsSession('STOP', applicationName);
            expect(testFn).toBeCalled();
        });
    });
});
