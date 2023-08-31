import { connect, getServiceConnection } from '../../Connection/ConnectionApi';
import { WebSocketResponse } from '../../Connection/RequestTypes';
import { ServiceConnection } from '../../Connection/ServiceConnection';
import {
    startAnalyticsSession,
    stopAnalyticsSession,
    isAnalyticsActive,
    unregisterAnalyticEvents,
    getRegisteredAnalyticEventKeys,
    registerAnalyticEvents,
    getAnalyticSessionEvents,
} from '../AnalyticsApi';
import { AnalyticEventKey } from '../AnalyticsTypes';

const successResponse = new WebSocketResponse('test', 'Success', 'test', 'test');

const requestMock = (serviceConnection: ServiceConnection | null) => {
    if (!serviceConnection) throw new Error('Service connection not available');

    return jest.spyOn(serviceConnection, 'analyticsSessionRequest').mockImplementation((_arg1, _arg2, callback) => {
        callback?.(successResponse);
    });
};

describe('Analytics', () => {
    test('no service connection', () => {
        const testFn = jest.fn();
        startAnalyticsSession('test', { callback: testFn });
        expect(testFn).toBeCalledTimes(0);
    });

    describe('start/stopAnalyticsSession', () => {
        let serviceConnection: ServiceConnection | null = null;
        const applicationName = 'testApplication';
        let updateSessionEventsMock: jest.SpyInstance;

        beforeAll(() => {
            connect();
            serviceConnection = getServiceConnection();
            if (!serviceConnection) throw new Error('Service connection not available');
            updateSessionEventsMock = jest
                .spyOn(serviceConnection, 'updateAnalyticSessionEvents')
                .mockImplementation((_sessionID, _events, callback) => {
                    callback?.(successResponse);
                });
        });

        beforeEach(() => {
            if (!serviceConnection) throw new Error('Service connection not available');
            const testFn = jest
                .spyOn(serviceConnection, 'analyticsSessionRequest')
                .mockImplementation((requestType, sessionID, callback) => {
                    expect(sessionID.includes(applicationName)).toBe(true);
                    callback?.(successResponse);
                    return requestType;
                });
            stopAnalyticsSession(applicationName);
            testFn.mockRestore();
        });

        it('should call analyticsSessionRequest with the correct arguments', () => {
            if (!serviceConnection) throw new Error('Service connection not available');
            const testFn = jest
                .spyOn(serviceConnection, 'analyticsSessionRequest')
                .mockImplementation((requestType, sessionID, callback) => {
                    expect(sessionID.includes(applicationName)).toBe(true);
                    callback?.(successResponse);
                    return requestType;
                });

            startAnalyticsSession(applicationName);
            expect(testFn).toReturnWith('START');

            stopAnalyticsSession(applicationName);
            expect(testFn).toReturnWith('STOP');
            testFn.mockRestore();
        });

        it('should call updateAnalyticSessionEvents every 2 seconds on successful start', async () => {
            const mockCalls = updateSessionEventsMock.mock.calls.length;
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls);
            jest.useFakeTimers();
            const mock = requestMock(serviceConnection);

            startAnalyticsSession(applicationName);
            jest.advanceTimersByTime(2000);
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls + 1);
            jest.advanceTimersByTime(1000);
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls + 1);
            jest.advanceTimersByTime(1000);
            expect(updateSessionEventsMock).toBeCalledTimes(mockCalls + 2);
            stopAnalyticsSession(applicationName);
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
                .spyOn(serviceConnection, 'analyticsSessionRequest')
                .mockImplementation((_arg1, sessionID, callback) => {
                    id = sessionID;
                    // This callback is here to mimic the Service sending a successful response
                    callback?.(successResponse);
                });
            const testFn = jest.spyOn(console, 'warn').mockImplementation((arg) => {
                expect(arg).toBe(`Session: ${id} already in progress`);
            });

            startAnalyticsSession(applicationName);
            startAnalyticsSession(applicationName);
            stopAnalyticsSession(applicationName);
            expect(testFn).toBeCalled();

            testFn.mockRestore();
            mock.mockRestore();
        });

        it('should give appropriate warnings on STOP', () => {
            const mock = requestMock(serviceConnection);
            const testFn = jest.spyOn(console, 'warn').mockImplementation((arg) => {
                expect(arg).toBe('No active session');
            });

            stopAnalyticsSession(applicationName);
            expect(testFn).toBeCalled();

            testFn.mockRestore();
            mock.mockRestore();
        });

        test('isAnalyticsActive should correctly return the status of the session', () => {
            const mock = requestMock(serviceConnection);

            stopAnalyticsSession(applicationName);

            expect(isAnalyticsActive()).toBe(false);

            startAnalyticsSession(applicationName);

            stopAnalyticsSession(applicationName);
            expect(isAnalyticsActive()).toBe(false);
            mock.mockRestore();
        });

        test('startAnalyticsSession should stop the current running session if required', () => {
            if (!serviceConnection) throw new Error('Service connection not available');

            let id: string;
            const testFn = jest
                .spyOn(serviceConnection, 'analyticsSessionRequest')
                .mockImplementationOnce((requestType, sessionID, callback) => {
                    id = sessionID;
                    expect(requestType).toBe('START');
                    // This callback is here to mimic the Service sending a successful response
                    callback?.(successResponse);
                    startAnalyticsSession(applicationName, { stopCurrentSession: true });
                })
                .mockImplementationOnce((requestType, _sessionID, callback) => {
                    expect(requestType).toBe('STOP');
                    callback?.(successResponse);
                })
                .mockImplementationOnce((requestType, sessionID, callback) => {
                    expect(requestType).toBe('START');
                    expect(id !== sessionID).toBe(true);
                    callback?.(successResponse);
                    stopAnalyticsSession(applicationName);
                });

            startAnalyticsSession(applicationName, { stopCurrentSession: true });
            expect(testFn).toHaveBeenCalled();
            testFn.mockRestore();
        });

        test('callbacks should be called when provided', () => {
            const mock = requestMock(serviceConnection);
            const testFn = jest.fn();
            startAnalyticsSession(applicationName, { callback: testFn });
            stopAnalyticsSession(applicationName, { callback: testFn });
            expect(testFn).toBeCalledTimes(2);
            mock.mockRestore();
        });

        test('callbacks should be called when provided when Start function stopping previous', () => {
            if (!serviceConnection) throw new Error('Service connection not available');

            const testFn = jest.fn();

            const mock = jest
                .spyOn(serviceConnection, 'analyticsSessionRequest')
                .mockImplementationOnce((_requestType, _sessionID, callback) => {
                    // This callback is here to mimic the Service sending a successful response
                    callback?.(successResponse);
                    startAnalyticsSession(applicationName, { callback: testFn, stopCurrentSession: true });
                })
                .mockImplementationOnce((_requestType, _sessionID, callback) => {
                    callback?.(successResponse);
                })
                .mockImplementationOnce((_requestType, _sessionID, callback) => {
                    callback?.(successResponse);
                    stopAnalyticsSession(applicationName);
                });

            startAnalyticsSession(applicationName);
            expect(testFn).toBeCalledTimes(1);
            mock.mockRestore();
        });
    });

    describe('registerAnalyticEvents', () => {
        const listeners: string[] = [];
        const addedEvents: AnalyticEventKey[] = [];

        const mock = jest.spyOn(document, 'addEventListener').mockImplementation((event, _callback, option) => {
            listeners.push(event);
            expect(option).toBeTruthy();
        });
        afterAll(mock.mockRestore);

        beforeEach(() => {
            unregisterAnalyticEvents();
            expect(getRegisteredAnalyticEventKeys()).toEqual([]);
            listeners.length = 0;
            addedEvents.length = 0;
        });

        it('should register specified events', () => {
            const testRegisteringEvent = (events: AnalyticEventKey[]) => {
                registerAnalyticEvents(events);
                addedEvents.push(...events);
                expect(getRegisteredAnalyticEventKeys()).toEqual(addedEvents);
            };

            testRegisteringEvent(['pointerdown', 'keypress']);
            testRegisteringEvent(['touchstart']);
            testRegisteringEvent(['click']);

            expect(addedEvents).toEqual(listeners);
        });

        it('should register default events if none specified', () => {
            const defaults: AnalyticEventKey[] = ['touchstart', 'touchmove', 'touchend'];
            registerAnalyticEvents();
            addedEvents.push(...defaults);
            expect(getRegisteredAnalyticEventKeys()).toEqual(defaults);

            expect(addedEvents).toEqual(listeners);
        });

        it('should handle registering duplicate events', () => {
            registerAnalyticEvents(['pointerdown']);
            addedEvents.push('pointerdown');
            expect(getRegisteredAnalyticEventKeys()).toEqual(addedEvents);
            registerAnalyticEvents(['pointerdown']);
            expect(getRegisteredAnalyticEventKeys()).toEqual(addedEvents);
            registerAnalyticEvents(['keypress', 'keypress']);
            addedEvents.push('keypress');
            expect(getRegisteredAnalyticEventKeys()).toEqual(addedEvents);

            expect(addedEvents).toEqual(listeners);
        });
    });

    describe('unregisterAnalyticEvents', () => {
        const listeners: string[] = [];
        const defaults: AnalyticEventKey[] = ['touchstart', 'touchmove', 'touchend'];

        const mock = jest.spyOn(document, 'removeEventListener').mockImplementation((event, _callback, option) => {
            listeners.push(event);
            expect(option).toBeTruthy();
        });
        afterAll(mock.mockRestore);

        beforeEach(() => {
            unregisterAnalyticEvents();
            registerAnalyticEvents(defaults);
            expect(getRegisteredAnalyticEventKeys()).toEqual(defaults);
            listeners.length = 0;
        });

        it('should unregister specified events', () => {
            unregisterAnalyticEvents(['touchstart', 'touchmove']);
            expect(getRegisteredAnalyticEventKeys()).toEqual(['touchend']);
            unregisterAnalyticEvents(['touchend']);
            expect(getRegisteredAnalyticEventKeys()).toEqual([]);

            expect(listeners).toEqual(defaults);
        });

        it('should unregister all events if none specified', () => {
            unregisterAnalyticEvents();
            expect(getRegisteredAnalyticEventKeys()).toEqual([]);
            expect(listeners).toEqual(defaults);
        });

        it('should handle un-registering non registered events', () => {
            expect(getRegisteredAnalyticEventKeys()).not.toContain('pointerdown');
            unregisterAnalyticEvents(['pointerdown']);
            expect(getRegisteredAnalyticEventKeys()).toEqual(defaults);

            expect(listeners).toEqual([]);
        });
    });

    describe('AnalyticSessionEvents', () => {
        const pointerDownEvent = new Event('pointerdown');
        const keypressEvent = new Event('keypress');

        it('should increment AnalyticSessionEvents count when event is triggered', () => {
            registerAnalyticEvents(['pointerdown', 'keypress']);
            registerAnalyticEvents(['pointerdown', 'keypress']);
            document.dispatchEvent(pointerDownEvent);
            expect(getAnalyticSessionEvents()).toEqual({ pointerdown: 1 });
            document.dispatchEvent(pointerDownEvent);
            document.dispatchEvent(pointerDownEvent);
            document.dispatchEvent(pointerDownEvent);
            expect(getAnalyticSessionEvents()).toEqual({ pointerdown: 4 });
            document.dispatchEvent(keypressEvent);
            document.dispatchEvent(keypressEvent);
            document.dispatchEvent(keypressEvent);
            document.dispatchEvent(pointerDownEvent);
            expect(getAnalyticSessionEvents()).toEqual({ pointerdown: 5, keypress: 3 });
        });
        it('should not increment when a non-registered event is triggered', () => {
            document.dispatchEvent(new Event('pointerup'));
            expect(getAnalyticSessionEvents()).toEqual({ pointerdown: 5, keypress: 3 });
        });
        it('should not increment when a registered event is triggered by TF', () => {
            document.dispatchEvent(new Event('pointerdown'));
            expect(getAnalyticSessionEvents()).toEqual({ pointerdown: 6, keypress: 3 });
            // PointerEvent is not defined in jest (see https://github.com/kulshekhar/ts-jest/issues/1035).
            // Instead we have to mimic it by forcibly adding the pointerType property to the Event
            const tfEvent = new Event('pointerdown');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (tfEvent as any).pointerType = 'pen';
            document.dispatchEvent(tfEvent);
            expect(getAnalyticSessionEvents()).toEqual({ pointerdown: 6, keypress: 3 });
        });
        it('should not increment when an un-registered event is triggered', () => {
            unregisterAnalyticEvents(['pointerdown']);
            document.dispatchEvent(pointerDownEvent);
            document.dispatchEvent(keypressEvent);
            expect(getAnalyticSessionEvents()).toEqual({ pointerdown: 6, keypress: 4 });
        });
    });
});
