import { ConnectionManager } from '../Connection/ConnectionManager';
import { AnalyticEventKey, WebSocketResponse } from '../Connection/TouchFreeServiceTypes';
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
        const mocks: jest.SpyInstance[] = [];
        let updateSessionEventsMock: jest.SpyInstance;

        beforeAll(() => {
            ConnectionManager.init();
            serviceConnection = ConnectionManager.serviceConnection();
            if (!serviceConnection) fail('Service connection not available');
            updateSessionEventsMock = jest
                .spyOn(serviceConnection, 'UpdateAnalyticSessionEvents')
                .mockImplementation((_sessionID, callback) => {
                    callback?.(new WebSocketResponse('test', 'Success', 'test', 'test'));
                });
        });
        afterAll(() => mocks.forEach((mock) => mock.mockRestore()));

        it('should call AnalyticsSessionRequest with the correct arguments', () => {
            if (!serviceConnection) fail('Service connection not available');
            const testFn = jest
                .spyOn(serviceConnection, 'AnalyticsSessionRequest')
                .mockImplementation((requestType, sessionID, callback) => {
                    expect(sessionID.includes(applicationName)).toBe(true);
                    callback?.(new WebSocketResponse('test', 'Success', 'test', 'test'));
                    return requestType;
                });
            mocks.push(testFn);

            TouchFree.ControlAnalyticsSession('START', applicationName);
            expect(testFn).toReturnWith('START');

            TouchFree.ControlAnalyticsSession('STOP', applicationName);
            expect(testFn).toReturnWith('STOP');
        });

        it('should call UpdateAnalyticSessionEvents every 2 seconds on successful start', async () => {
            const mockCalls = updateSessionEventsMock.mock.calls.length;
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls);
            jest.useFakeTimers();
            TouchFree.ControlAnalyticsSession('START', applicationName);
            jest.advanceTimersByTime(2000);
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls + 1);
            jest.advanceTimersByTime(1000);
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls + 1);
            jest.advanceTimersByTime(1000);
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls + 2);
            TouchFree.ControlAnalyticsSession('STOP', applicationName);
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls + 3);
            jest.advanceTimersByTime(4000);
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls + 3);
            jest.useRealTimers();
        });

        it('should give appropriate warnings on START', () => {
            if (!serviceConnection) fail('Service connection not available');
            let id = '';

            const mock = jest
                .spyOn(serviceConnection, 'AnalyticsSessionRequest')
                .mockImplementation((_arg1, sessionID, callback) => {
                    id = sessionID;
                    // This callback is here to mimic the Service sending a successful response
                    callback?.(new WebSocketResponse('test', 'Success', 'test', 'test'));
                });
            const testFn = jest.spyOn(console, 'warn').mockImplementation((arg) => {
                expect(arg).toBe(`Session: ${id} already in progress`);
            });
            mocks.push(testFn, mock);

            TouchFree.ControlAnalyticsSession('START', applicationName);
            TouchFree.ControlAnalyticsSession('START', applicationName);
            TouchFree.ControlAnalyticsSession('STOP', applicationName);
            expect(testFn).toBeCalled();
        });

        it('should give appropriate warnings on STOP', () => {
            if (!serviceConnection) fail('Service connection not available');

            const mock = jest.spyOn(serviceConnection, 'AnalyticsSessionRequest').mockImplementation(() => {});
            const testFn = jest.spyOn(console, 'warn').mockImplementation((arg) => {
                expect(arg).toBe('No active session');
            });
            mocks.push(testFn, mock);

            TouchFree.ControlAnalyticsSession('STOP', applicationName);
            expect(testFn).toBeCalled();
        });

        test('IsAnalyticsActive should correctly return the status of the session', () => {
            if (!serviceConnection) fail('Service connection not available');

            expect(TouchFree.IsAnalyticsActive()).toBe(false);

            TouchFree.ControlAnalyticsSession('START', 'test');
            jest.spyOn(serviceConnection, 'AnalyticsSessionRequest').mockImplementation((_arg1, _arg2, callback) => {
                // This callback is here to mimic the Service sending a successful response
                callback?.(new WebSocketResponse('test', 'Success', 'test', 'test'));
                expect(TouchFree.IsAnalyticsActive()).toBe(true);
            });

            TouchFree.ControlAnalyticsSession('STOP', 'test');
            expect(TouchFree.IsAnalyticsActive()).toBe(false);
        });
    });

    describe('RegisterAnalyticEvents', () => {
        const listeners: string[] = [];
        const addedEvents: AnalyticEventKey[] = [];

        const mock = jest.spyOn(document, 'addEventListener').mockImplementation((event, _callback, option) => {
            listeners.push(event);
            expect(option).toBeTruthy();
        });
        afterAll(mock.mockRestore);

        beforeEach(() => {
            TouchFree.UnregisterAnalyticEvents();
            expect(TouchFree.GetRegisteredAnalyticEventKeys()).toEqual([]);
            listeners.length = 0;
            addedEvents.length = 0;
        });

        it('should register specified events', () => {
            const testRegisteringEvent = (events: AnalyticEventKey[]) => {
                TouchFree.RegisterAnalyticEvents(events);
                addedEvents.push(...events);
                expect(TouchFree.GetRegisteredAnalyticEventKeys()).toEqual(addedEvents);
            };

            testRegisteringEvent(['pointerdown', 'keypress']);
            testRegisteringEvent(['touchstart']);
            testRegisteringEvent(['click']);

            expect(addedEvents).toEqual(listeners);
        });

        it('should register default events if none specified', () => {
            const defaults: AnalyticEventKey[] = ['touchstart', 'touchmove', 'touchend'];
            TouchFree.RegisterAnalyticEvents();
            addedEvents.push(...defaults);
            expect(TouchFree.GetRegisteredAnalyticEventKeys()).toEqual(defaults);

            expect(addedEvents).toEqual(listeners);
        });

        it('should handle registering duplicate events', () => {
            TouchFree.RegisterAnalyticEvents(['pointerdown']);
            addedEvents.push('pointerdown');
            expect(TouchFree.GetRegisteredAnalyticEventKeys()).toEqual(addedEvents);
            TouchFree.RegisterAnalyticEvents(['pointerdown']);
            expect(TouchFree.GetRegisteredAnalyticEventKeys()).toEqual(addedEvents);
            TouchFree.RegisterAnalyticEvents(['keypress', 'keypress']);
            addedEvents.push('keypress');
            expect(TouchFree.GetRegisteredAnalyticEventKeys()).toEqual(addedEvents);

            expect(addedEvents).toEqual(listeners);
        });
    });

    describe('UnregisterAnalyticEvents', () => {
        const listeners: string[] = [];
        const defaults: AnalyticEventKey[] = ['touchstart', 'touchmove', 'touchend'];

        const mock = jest.spyOn(document, 'removeEventListener').mockImplementation((event, _callback, option) => {
            listeners.push(event);
            expect(option).toBeTruthy();
        });
        afterAll(mock.mockRestore);

        beforeEach(() => {
            TouchFree.UnregisterAnalyticEvents();
            TouchFree.RegisterAnalyticEvents(defaults);
            expect(TouchFree.GetRegisteredAnalyticEventKeys()).toEqual(defaults);
            listeners.length = 0;
        });

        it('should unregister specified events', () => {
            TouchFree.UnregisterAnalyticEvents(['touchstart', 'touchmove']);
            expect(TouchFree.GetRegisteredAnalyticEventKeys()).toEqual(['touchend']);
            TouchFree.UnregisterAnalyticEvents(['touchend']);
            expect(TouchFree.GetRegisteredAnalyticEventKeys()).toEqual([]);

            expect(listeners).toEqual(defaults);
        });

        it('should unregister all events if none specified', () => {
            TouchFree.UnregisterAnalyticEvents();
            expect(TouchFree.GetRegisteredAnalyticEventKeys()).toEqual([]);
            expect(listeners).toEqual(defaults);
        });

        it('should handle un-registering non registered events', () => {
            expect(TouchFree.GetRegisteredAnalyticEventKeys()).not.toContain('pointerdown');
            TouchFree.UnregisterAnalyticEvents(['pointerdown']);
            expect(TouchFree.GetRegisteredAnalyticEventKeys()).toEqual(defaults);

            expect(listeners).toEqual([]);
        });
    });

    describe('AnalyticSessionEvents', () => {
        const pointerDownEvent = new Event('pointerdown');
        const keypressEvent = new Event('keypress');

        it('should increment AnalyticSessionEvents count when event is triggered', () => {
            TouchFree.RegisterAnalyticEvents(['pointerdown', 'keypress']);
            TouchFree.RegisterAnalyticEvents(['pointerdown', 'keypress']);
            document.dispatchEvent(pointerDownEvent);
            expect(TouchFree.GetAnalyticSessionEvents()).toEqual({ pointerdown: 1 });
            document.dispatchEvent(pointerDownEvent);
            document.dispatchEvent(pointerDownEvent);
            document.dispatchEvent(pointerDownEvent);
            expect(TouchFree.GetAnalyticSessionEvents()).toEqual({ pointerdown: 4 });
            document.dispatchEvent(keypressEvent);
            document.dispatchEvent(keypressEvent);
            document.dispatchEvent(keypressEvent);
            document.dispatchEvent(pointerDownEvent);
            expect(TouchFree.GetAnalyticSessionEvents()).toEqual({ pointerdown: 5, keypress: 3 });
        });
        it('should not increment when a non-registered event is triggered', () => {
            document.dispatchEvent(new Event('pointerup'));
            expect(TouchFree.GetAnalyticSessionEvents()).toEqual({ pointerdown: 5, keypress: 3 });
        });
        it('should not increment when an un-registered event is trigger', () => {
            TouchFree.UnregisterAnalyticEvents(['pointerdown']);
            document.dispatchEvent(pointerDownEvent);
            document.dispatchEvent(keypressEvent);
            expect(TouchFree.GetAnalyticSessionEvents()).toEqual({ pointerdown: 5, keypress: 4 });
        });
    });
});
