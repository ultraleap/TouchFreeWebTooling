import { HandDataManager } from '../../Plugins/HandDataManager';
import TouchFree, { EventHandle } from '../../TouchFree';
import { BitmaskFlags, ConvertInputAction, WebsocketInputAction } from '../../TouchFreeToolingTypes';
import { intervalTest } from '../../tests/testUtils';
import { ConnectionManager } from '../ConnectionManager';
import { ServiceConnection } from '../ServiceConnection';
import { ActionCode, HandPresenceState, InteractionZoneState } from '../TouchFreeServiceTypes';
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
        serviceConnection?.OnMessage(
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
        const testFn = jest.spyOn(console, consoleProperty as 'Console').mockImplementation();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jest.spyOn(serviceConnection as any, 'RequestHandshake').mockImplementation();
        ConnectionManager.messageReceiver.handshakeCallbacks['handshake-guid'] = {
            timestamp: Date.now(),
            callback: () => {},
        };

        return testFn;
    };

    const createInputAction = (flag?: BitmaskFlags, position?: { x: number; y: number }) => {
        const newFlag = flag ?? BitmaskFlags.MOVE;
        const newPos = position ?? { x: 0, y: 0 };

        return new WebsocketInputAction(
            Date.now(),
            BitmaskFlags.LEFT + BitmaskFlags.PRIMARY + newFlag + BitmaskFlags.PUSH,
            newPos,
            0,
            0
        );
    };

    let handler: EventHandle;

    afterEach(() => {
        if (!handler) return;
        handler.UnregisterEventCallback();
    });

    beforeEach(() => {
        // Reset service after each test to completely reset mocks
        TouchFree.Init();
        serviceConnection = ConnectionManager.serviceConnection();
        jest.restoreAllMocks();
        if (serviceConnection) {
            serviceConnection.webSocket.send = jest.fn((msg) => {
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
        const testFn = jest
            .spyOn(console, 'warn')
            .mockImplementation((message: string) =>
                message.includes('Received a Handshake Response that did not match a callback')
            );

        onMessage(ActionCode.VERSION_HANDSHAKE_RESPONSE);

        await intervalTest(() => expect(testFn).toReturnWith(true));
    });

    it('should correctly check for a response with a callback', async () => {
        const testFn = jest.fn();
        mockOpen();
        const guid = uuidgen();
        serviceConnection?.SendMessage('test', guid, testFn);

        onMessage(ActionCode.SERVICE_STATUS_RESPONSE, undefined, guid);

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for a response without a callback', async () => {
        const testFn = jest
            .spyOn(console, 'warn')
            .mockImplementation((message: string) =>
                message.includes('Received a Handshake Response that did not match a callback')
            );

        onMessage(ActionCode.SERVICE_STATUS_RESPONSE, undefined, uuidgen());
        mockOpen();

        await intervalTest(() => expect(testFn).toReturnWith(true));
    });

    it('should correctly check for a config state with a callback', async () => {
        const testFn = jest.fn();
        mockOpen();
        serviceConnection?.RequestConfigState(testFn);

        onMessage(ActionCode.CONFIGURATION_STATE, undefined, JSON.parse(message).guid);

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for a config state without a callback', async () => {
        const testFn = jest.spyOn(console, 'warn');
        testFn.mockImplementation(() => {});

        onMessage(ActionCode.CONFIGURATION_STATE);
        mockOpen();

        await intervalTest(() => {
            expect(testFn).toBeCalledWith('Received a ConfigState message that did not match a callback.');
        });
    });

    it('should correctly check for the service status with a callback', async () => {
        mockOpen();
        const testFn = jest.fn();
        serviceConnection?.RequestServiceStatus(testFn);

        onMessage(ActionCode.SERVICE_STATUS, undefined, JSON.parse(message).guid);

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for the service status without a callback', async () => {
        mockOpen();
        const testFn = jest.fn();
        TouchFree.RegisterEventCallback('OnServiceStatusChange', testFn);

        onMessage(ActionCode.SERVICE_STATUS);

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for the tracking state response', async () => {
        const testFn = jest.fn();
        mockOpen();
        serviceConnection?.RequestTrackingState(testFn);

        onMessage(ActionCode.TRACKING_STATE, undefined, JSON.parse(message).guid);

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for the session state change response', async () => {
        const testFn = jest.fn();
        mockOpen();
        serviceConnection?.AnalyticsSessionRequest('START', 'test', testFn);

        onMessage(ActionCode.ANALYTICS_SESSION_REQUEST, undefined, JSON.parse(message).guid);

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for a hand presence event', async () => {
        const testFn = jest.spyOn(ConnectionManager, 'HandleHandPresenceEvent');
        testFn.mockImplementation(() => {});
        mockOpen();

        onMessage(ActionCode.HAND_PRESENCE_EVENT, { state: HandPresenceState.HAND_FOUND });

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for an interaction zone event', async () => {
        const testFn = jest.spyOn(ConnectionManager, 'HandleInteractionZoneEvent').mockImplementation();
        mockOpen();

        onMessage(ActionCode.INTERACTION_ZONE_EVENT, { state: InteractionZoneState.HAND_ENTERED });

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for an input action', async () => {
        const testFn = jest.fn();
        handler = TouchFree.RegisterEventCallback('TransmitInputAction', testFn);
        mockOpen();

        const action = new WebsocketInputAction(
            Date.now(),
            BitmaskFlags.LEFT + BitmaskFlags.PRIMARY + BitmaskFlags.MOVE + BitmaskFlags.PUSH,
            { x: 0, y: 0 },
            0,
            0
        );

        onMessage(ActionCode.INPUT_ACTION, { ...action });

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });

    it('should correctly check for an UP input action', async () => {
        mockOpen();

        const moveAction = createInputAction();
        const upAction = createInputAction(BitmaskFlags.UP, { x: 30, y: 30 });

        const { CursorPosition } = ConvertInputAction(moveAction);

        const testFn = jest.fn((action) => action.CursorPosition);
        handler = TouchFree.RegisterEventCallback('TransmitInputAction', testFn);

        onMessage(ActionCode.INPUT_ACTION, { ...moveAction });
        onMessage(ActionCode.INPUT_ACTION, { ...upAction });

        await intervalTest(() => {
            expect(testFn).toBeCalledTimes(2);
            expect(testFn).lastReturnedWith(CursorPosition);
        });
    });

    it('should correctly cull all excess non-key actions', async () => {
        const testFn = jest.fn();
        handler = TouchFree.RegisterEventCallback('TransmitInputAction', testFn);
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
        const testFn = jest.fn();
        handler = TouchFree.RegisterEventCallback('TransmitInputAction', testFn);
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
        const testFn = jest.spyOn(HandDataManager, 'HandleHandFrame').mockImplementation();
        mockOpen();

        serviceConnection?.OnMessage(new MessageEvent('message', { data: [1, 0, 0, 0] }));

        await intervalTest(() => expect(testFn).toBeCalledTimes(1));
    });
});
