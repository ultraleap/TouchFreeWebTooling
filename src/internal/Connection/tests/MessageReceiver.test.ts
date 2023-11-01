import { HandDataManager } from '../../Hands/HandDataManager';
import { init } from '../../Initialization/Initialization';
import { type TouchFreeEventHandle, registerEventCallback } from '../../TouchFreeEvents/TouchFreeEvents';
import { intervalTest } from '../../tests/testUtils';
import { ActionCode } from '../ActionCode';
import { getServiceConnection } from '../ConnectionApi';
import { HandPresenceState, InteractionZoneState } from '../ConnectionTypes';
import { ServiceConnection } from '../ServiceConnection';
import { BitmaskFlags, type WebsocketInputAction, convertInputAction } from '../WebsocketInputAction';
import { v4 as uuidgen } from 'uuid';

describe('MessageReceiver', () => {
    let serviceConnection: ServiceConnection | null;
    let message: string;

    const onMessage = (actionCode: ActionCode, content?: { [key: string]: unknown }, guid?: string) => {
        let requestID: string;
        if (guid) {
            requestID = guid;
        } else if (message) {
            requestID = JSON.parse(message).content.requestID;
        } else {
            requestID = uuidgen();
        }
        const messageContent = {
            requestID: requestID,
            originalRequest: message,
            status: 'Success',
            message: 'Successful Test',
            ...content,
        };
        serviceConnection?.onMessage(
            new MessageEvent('message', {
                data: JSON.stringify({
                    action: actionCode,
                    content: messageContent,
                }),
            })
        );
        return messageContent;
    };

    const mockOpen = () => serviceConnection?.webSocket.dispatchEvent(new Event('open'));

    const mockHandshake = (consoleProperty: string) => {
        const testFn = vi.spyOn(console, consoleProperty as 'Console');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.spyOn(serviceConnection as any, 'requestHandshake');
        if (serviceConnection === null) return;
        serviceConnection.getCallbackLists().handshakeCallbacks.callbacks['handshake-guid'] = {
            timestamp: Date.now(),
            callback: () => {},
        };

        return testFn;
    };

    const createInputAction = (flag?: BitmaskFlags, position?: { x: number; y: number }): WebsocketInputAction => {
        const newFlag = flag ?? BitmaskFlags.MOVE;
        const newPos = position ?? { x: 0, y: 0 };

        return {
            Timestamp: Date.now(),
            InteractionFlags: BitmaskFlags.LEFT + BitmaskFlags.PRIMARY + newFlag + BitmaskFlags.PUSH,
            CursorPosition: newPos,
            DistanceFromScreen: 0,
            ProgressToClick: 0,
        };
    };

    let handler: TouchFreeEventHandle;

    afterEach(() => {
        if (!handler) return;
        handler.unregisterEventCallback();
    });

    beforeEach(() => {
        // Reset service after each test to completely reset mocks
        init();
        serviceConnection = getServiceConnection();
        vi.restoreAllMocks();
        if (serviceConnection) {
            serviceConnection.webSocket.send = vi.fn((msg) => {
                message = msg as string;
            });
        }
        message = '';
    });

    it('should correctly handle a handshake warning', async () => {
        const testFn = mockHandshake('warn');
        mockOpen();

        onMessage(ActionCode.VERSION_HANDSHAKE_RESPONSE, { message: 'Handshake Warning' }, 'handshake-guid');

        await intervalTest(() => {
            expect(testFn).toBeCalledWith('Received Handshake Warning from TouchFree:\n' + 'Handshake Warning');
        });
    });

    it('should correctly handle a handshake error', async () => {
        const testFn = mockHandshake('error');
        mockOpen();

        onMessage(
            ActionCode.VERSION_HANDSHAKE_RESPONSE,
            { message: 'Handshake Error', status: 'Error' },
            'handshake-guid'
        );

        await intervalTest(() => {
            expect(testFn).toBeCalledWith('Received Handshake Error from TouchFree:\n' + 'Handshake Error');
        });
    });

    it('should correctly check for a handshake response without a callback', async () => {
        const testFn = vi
            .spyOn(console, 'warn')
            .mockImplementation((message: string) =>
                message.includes('Received a Handshake Response that did not match a callback')
            );

        onMessage(ActionCode.VERSION_HANDSHAKE_RESPONSE);

        await intervalTest(() => expect(testFn).toReturnWith(true));
    });

    it('should correctly check for a response with a callback', async () => {
        const testFn = vi.fn();
        mockOpen();
        const guid = uuidgen();
        serviceConnection?.sendMessage('test', guid, testFn);

        onMessage(ActionCode.SERVICE_STATUS_RESPONSE, undefined, guid);

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for a response without a callback', async () => {
        const testFn = vi
            .spyOn(console, 'warn')
            .mockImplementation((message: string) =>
                message.includes('Received a Handshake Response that did not match a callback')
            );

        onMessage(ActionCode.SERVICE_STATUS_RESPONSE, undefined, uuidgen());
        mockOpen();

        await intervalTest(() => expect(testFn).toReturnWith(true));
    });

    it('should correctly check for a config state with a callback', async () => {
        const testFn = vi.fn();
        mockOpen();
        serviceConnection?.requestConfigState(testFn);

        onMessage(ActionCode.CONFIGURATION_STATE, undefined, JSON.parse(message).guid);

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for a config state without a callback', async () => {
        const testFn = vi.spyOn(console, 'warn');
        testFn.mockImplementation(() => {});

        onMessage(ActionCode.CONFIGURATION_STATE);
        mockOpen();

        await intervalTest(() => {
            expect(testFn).toBeCalledWith('Received a ConfigState message that did not match a callback.');
        });
    });

    it('should correctly check for the service status with a callback', async () => {
        mockOpen();
        const testFn = vi.fn();
        serviceConnection?.requestServiceStatus(testFn);

        onMessage(ActionCode.SERVICE_STATUS, undefined, JSON.parse(message).guid);

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for the service status without a callback', async () => {
        mockOpen();
        const testFn = vi.fn();
        registerEventCallback('onServiceStatusChange', testFn);

        onMessage(ActionCode.SERVICE_STATUS);

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for the tracking state response', async () => {
        const testFn = vi.fn();
        mockOpen();
        serviceConnection?.requestTrackingState(testFn);

        onMessage(ActionCode.TRACKING_STATE, undefined, JSON.parse(message).guid);

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for the session state change response', async () => {
        const testFn = vi.fn();
        mockOpen();
        serviceConnection?.analyticsSessionRequest('START', 'test', testFn);

        onMessage(ActionCode.ANALYTICS_SESSION_REQUEST, undefined, JSON.parse(message).guid);

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for a hand presence event', async () => {
        if (serviceConnection === null) {
            expect(serviceConnection).toBeTruthy();
            return;
        }

        const testFn = vi.spyOn(serviceConnection, 'handleHandPresenceEvent');
        testFn.mockImplementation(() => {});
        mockOpen();

        onMessage(ActionCode.HAND_PRESENCE_EVENT, { state: HandPresenceState.HAND_FOUND });

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for an interaction zone event', async () => {
        if (serviceConnection === null) {
            expect(serviceConnection).toBeTruthy();
            return;
        }
        const testFn = vi.spyOn(serviceConnection, 'handleInteractionZoneEvent');
        mockOpen();

        onMessage(ActionCode.INTERACTION_ZONE_EVENT, { state: InteractionZoneState.HAND_ENTERED });

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for an input action', async () => {
        const testFn = vi.fn();
        handler = registerEventCallback('transmitInputAction', testFn);
        mockOpen();

        const action: WebsocketInputAction = {
            Timestamp: Date.now(),
            InteractionFlags: BitmaskFlags.LEFT + BitmaskFlags.PRIMARY + BitmaskFlags.MOVE + BitmaskFlags.PUSH,
            CursorPosition: { x: 0, y: 0 },
            DistanceFromScreen: 0,
            ProgressToClick: 0,
        };

        onMessage(ActionCode.INPUT_ACTION, { ...action });

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for an UP input action', async () => {
        mockOpen();

        const moveAction = createInputAction();
        const upAction = createInputAction(BitmaskFlags.UP, { x: 30, y: 30 });

        const { CursorPosition } = convertInputAction(moveAction);

        const testFn = vi.fn((action) => action.CursorPosition);
        handler = registerEventCallback('transmitInputAction', testFn);

        onMessage(ActionCode.INPUT_ACTION, { ...moveAction });
        onMessage(ActionCode.INPUT_ACTION, { ...upAction });

        await intervalTest(() => {
            expect(testFn).toBeCalledTimes(2);
            expect(testFn).lastReturnedWith(CursorPosition);
        });
    });

    it('should correctly cull all excess non-key actions', async () => {
        const testFn = vi.fn();
        handler = registerEventCallback('transmitInputAction', testFn);
        mockOpen();

        const moveAction = createInputAction();
        const noneAction = createInputAction(BitmaskFlags.NONE_INPUT);

        for (let i = 0; i < 5; i++) {
            onMessage(ActionCode.INPUT_ACTION, { ...moveAction });
            onMessage(ActionCode.INPUT_ACTION, { ...noneAction });
        }

        await intervalTest(() => {
            expect(testFn).toBeCalledTimes(2);
        });
    });

    it('should correctly not cull the key actions', async () => {
        const testFn = vi.fn();
        handler = registerEventCallback('transmitInputAction', testFn);
        mockOpen();

        const moveAction = createInputAction();
        const upAction = createInputAction(BitmaskFlags.UP);

        for (let i = 0; i < 10; i++) {
            if (i === 5) {
                onMessage(ActionCode.INPUT_ACTION, { ...upAction });
                continue;
            }
            onMessage(ActionCode.INPUT_ACTION, { ...moveAction });
        }

        await intervalTest(() => {
            expect(testFn).toBeCalledTimes(3);
        });
    });

    it('should correctly check for hand data', async () => {
        const testFn = vi.spyOn(HandDataManager, 'handleHandFrame');
        mockOpen();

        serviceConnection?.onMessage(new MessageEvent('message', { data: [1, 0, 0, 0] }));

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });
});
