import { ActionCode, CommunicationWrapper } from '../TouchFreeServiceTypes';

export interface IBaseMessageReceiver {
    ReceiveMessage: (message: CommunicationWrapper<unknown>) => void;
    actionCode: ActionCode[];
}
