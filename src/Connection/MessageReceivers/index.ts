import { CallbackHandler } from '../CallbackHandler';
import { AnalyticsMessageReceiver } from './AnalyticsMessageReceiver';
import { ConfigStateMessageReceiver } from './ConfigStateMessageReceiver';
import { HandPresenceMessageReceiver } from './HandPresenceMessageReceiver';
import { InputActionMessageReceiver } from './InputActionMessageReceiver';
import { InteractionZoneMessageReceiver } from './InteractionZoneMessageReceiver';
import { ResponseMessageReceiver } from './ResponseMessageReceiver';
import { ServiceStateMessageReceiver } from './ServiceStateMessageReceiver';
import { TrackingStateMessageReceiver } from './TrackingStateMessageReceiver';
import { VersionHandshakeMessageReceiver } from './VersionHandshakeMessageReceiver';

export { HandDataHandler } from './HandDataHandler';
export { MessageReceiver } from './BaseMessageReceiver';

export const createMessageReceivers = (callbackHandler: CallbackHandler) => {
    return [
        new AnalyticsMessageReceiver(callbackHandler),
        new ConfigStateMessageReceiver(callbackHandler),
        new HandPresenceMessageReceiver(),
        new InputActionMessageReceiver(),
        new InteractionZoneMessageReceiver(),
        new ResponseMessageReceiver(callbackHandler),
        new ServiceStateMessageReceiver(callbackHandler),
        new TrackingStateMessageReceiver(callbackHandler),
        new VersionHandshakeMessageReceiver(callbackHandler),
    ];
};
