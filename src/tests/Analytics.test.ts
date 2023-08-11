import { ConnectionManager } from '../Connection/ConnectionManager';
import { ServiceConnection } from '../Connection/ServiceConnection';
import { WebSocketResponse, AnalyticEventKey } from '../Connection/TouchFreeServiceTypes';
import TouchFree from '../TouchFree';

const successResponse = new WebSocketResponse('test', 'Success', 'test', 'test');

const requestMock = (serviceConnection: ServiceConnection | null) => {
    if (!serviceConnection) throw new Error('Service connection not available');

    return jest.spyOn(serviceConnection, 'AnalyticsSessionRequest').mockImplementation((_arg1, _arg2, callback) => {
        callback?.(successResponse);
    });
};

describe('Analytics', () => {
    test('no service connection', () => {
        const testFn = jest.fn();
        TouchFree.StartAnalyticsSession('test', { callback: testFn });
        expect(testFn).toBeCalledTimes(0);
    });

    describe('Start/StopAnalyticsSession', () => {
        let serviceConnection: ServiceConnection | null = null;
        const applicationName = 'testApplication';
        let updateSessionEventsMock: jest.SpyInstance;

        beforeAll(() => {
            ConnectionManager.init();
            serviceConnection = ConnectionManager.serviceConnection();
            if (!serviceConnection) throw new Error('Service connection not available');
            updateSessionEventsMock = jest
                .spyOn(serviceConnection, 'UpdateAnalyticSessionEvents')
                .mockImplementation((_sessionID, callback) => {
                    callback?.(successResponse);
                });
        });

        beforeEach(() => {
            if (!serviceConnection) throw new Error('Service connection not available');
            const testFn = jest
                .spyOn(serviceConnection, 'AnalyticsSessionRequest')
                .mockImplementation((requestType, sessionID, callback) => {
                    expect(sessionID.includes(applicationName)).toBe(true);
                    callback?.(successResponse);
                    return requestType;
                });
            TouchFree.StopAnalyticsSession(applicationName);
            testFn.mockRestore();
        });

        it('should call AnalyticsSessionRequest with the correct arguments', () => {
            if (!serviceConnection) throw new Error('Service connection not available');
            const testFn = jest
                .spyOn(serviceConnection, 'AnalyticsSessionRequest')
                .mockImplementation((requestType, sessionID, callback) => {
                    expect(sessionID.includes(applicationName)).toBe(true);
                    callback?.(successResponse);
                    return requestType;
                });

            TouchFree.StartAnalyticsSession(applicationName);
            expect(testFn).toReturnWith('START');

            TouchFree.StopAnalyticsSession(applicationName);
            expect(testFn).toReturnWith('STOP');
            testFn.mockRestore();
        });

        it('should call UpdateAnalyticSessionEvents every 2 seconds on successful start', async () => {
            const mockCalls = updateSessionEventsMock.mock.calls.length;
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls);
            jest.useFakeTimers();
            const mock = requestMock(serviceConnection);

            TouchFree.StartAnalyticsSession(applicationName);
            jest.advanceTimersByTime(2000);
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls + 1);
            jest.advanceTimersByTime(1000);
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls + 1);
            jest.advanceTimersByTime(1000);
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls + 2);
            TouchFree.StopAnalyticsSession(applicationName);
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls + 3);
            jest.advanceTimersByTime(4000);
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls + 3);
            jest.useRealTimers();
            mock.mockRestore();
        });

        it('should give appropriate warnings on START', () => {
            if (!serviceConnection) throw new Error('Service connection not available');
            let id = '';

            const mock = jest
                .spyOn(serviceConnection, 'AnalyticsSessionRequest')
                .mockImplementation((_arg1, sessionID, callback) => {
                    id = sessionID;
                    // This callback is here to mimic the Service sending a successful response
                    callback?.(successResponse);
                });
            const testFn = jest.spyOn(console, 'warn').mockImplementation((arg) => {
                expect(arg).toBe(`Session: ${id} already in progress`);
            });

            TouchFree.StartAnalyticsSession(applicationName);
            TouchFree.StartAnalyticsSession(applicationName);
            TouchFree.StopAnalyticsSession(applicationName);
            expect(testFn).toBeCalled();

            testFn.mockRestore();
            mock.mockRestore();
        });

        it('should give appropriate warnings on STOP', () => {
            const mock = requestMock(serviceConnection);
            const testFn = jest.spyOn(console, 'warn').mockImplementation((arg) => {
                expect(arg).toBe('No active session');
            });

            TouchFree.StopAnalyticsSession(applicationName);
            expect(testFn).toBeCalled();

            testFn.mockRestore();
            mock.mockRestore();
        });

        test('IsAnalyticsActive should correctly return the status of the session', () => {
            const mock = requestMock(serviceConnection);

            TouchFree.StopAnalyticsSession(applicationName);

            expect(TouchFree.IsAnalyticsActive()).toBe(false);

            TouchFree.StartAnalyticsSession(applicationName);

            TouchFree.StopAnalyticsSession(applicationName);
            expect(TouchFree.IsAnalyticsActive()).toBe(false);
            mock.mockRestore();
        });

        test('StartAnalyticsSession should stop the current running session if required', () => {
            if (!serviceConnection) throw new Error('Service connection not available');

            let id: string;
            const testFn = jest
                .spyOn(serviceConnection, 'AnalyticsSessionRequest')
                .mockImplementationOnce((requestType, sessionID, callback) => {
                    id = sessionID;
                    expect(requestType).toBe('START');
                    // This callback is here to mimic the Service sending a successful response
                    callback?.(successResponse);
                    TouchFree.StartAnalyticsSession(applicationName, { stopCurrentSession: true });
                })
                .mockImplementationOnce((requestType, _sessionID, callback) => {
                    expect(requestType).toBe('STOP');
                    callback?.(successResponse);
                })
                .mockImplementationOnce((requestType, sessionID, callback) => {
                    expect(requestType).toBe('START');
                    expect(id !== sessionID).toBe(true);
                    callback?.(successResponse);
                    TouchFree.StopAnalyticsSession(applicationName);
                });

            TouchFree.StartAnalyticsSession(applicationName, { stopCurrentSession: true });
            expect(testFn).toHaveBeenCalled();
            testFn.mockRestore();
        });

        test('callbacks should be called when provided', () => {
            const mock = requestMock(serviceConnection);
            const testFn = jest.fn();
            TouchFree.StartAnalyticsSession(applicationName, { callback: testFn });
            TouchFree.StopAnalyticsSession(applicationName, { callback: testFn });
            expect(testFn).toBeCalledTimes(2);
            mock.mockRestore();
        });

        test('callbacks should be called when provided when Start function stopping previous', () => {
            if (!serviceConnection) throw new Error('Service connection not available');

            const testFn = jest.fn();

            const mock = jest
                .spyOn(serviceConnection, 'AnalyticsSessionRequest')
                .mockImplementationOnce((_requestType, _sessionID, callback) => {
                    // This callback is here to mimic the Service sending a successful response
                    callback?.(successResponse);
                    TouchFree.StartAnalyticsSession(applicationName, { callback: testFn, stopCurrentSession: true });
                })
                .mockImplementationOnce((_requestType, _sessionID, callback) => {
                    callback?.(successResponse);
                })
                .mockImplementationOnce((_requestType, _sessionID, callback) => {
                    callback?.(successResponse);
                    TouchFree.StopAnalyticsSession(applicationName);
                });

            TouchFree.StartAnalyticsSession(applicationName);
            expect(testFn).toBeCalledTimes(1);
            mock.mockRestore();
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
        it('should not increment when a registered event is triggered by TF', () => {
            document.dispatchEvent(new Event('pointerdown'));
            expect(TouchFree.GetAnalyticSessionEvents()).toEqual({ pointerdown: 6, keypress: 3 });
            // PointerEvent is not defined in jest (see https://github.com/kulshekhar/ts-jest/issues/1035).
            // Instead we have to mimic it by forcibly adding the pointerType property to the Event
            const tfEvent = new Event('pointerdown');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (tfEvent as any).pointerType = 'pen';
            document.dispatchEvent(tfEvent);
            expect(TouchFree.GetAnalyticSessionEvents()).toEqual({ pointerdown: 6, keypress: 3 });
        });
        it('should not increment when an un-registered event is trigger', () => {
            TouchFree.UnregisterAnalyticEvents(['pointerdown']);
            document.dispatchEvent(pointerDownEvent);
            document.dispatchEvent(keypressEvent);
            expect(TouchFree.GetAnalyticSessionEvents()).toEqual({ pointerdown: 6, keypress: 4 });
        });
    });
});
