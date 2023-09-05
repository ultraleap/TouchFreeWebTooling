import { ServiceConnection } from '../ServiceConnection';
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

export const createMessageReceivers = (serviceConnection: ServiceConnection) => {
    const callbacks = serviceConnection.getCallbackLists();
    return [
        new AnalyticsMessageReceiver(callbacks.analyticsRequestCallbacks),
        new ConfigStateMessageReceiver(callbacks.configStateCallbacks),
        new HandPresenceMessageReceiver(serviceConnection),
        new InputActionMessageReceiver(),
        new InteractionZoneMessageReceiver(serviceConnection),
        new ResponseMessageReceiver(callbacks.responseCallbacks),
        new ServiceStateMessageReceiver(callbacks.serviceStatusCallbacks),
        new TrackingStateMessageReceiver(callbacks.trackingStateCallbacks),
        new VersionHandshakeMessageReceiver(callbacks.handshakeCallbacks),
    ];
};
