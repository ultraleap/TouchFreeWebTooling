import { ActionCode, CommunicationWrapper } from '../TouchFreeServiceTypes';

export interface IBaseMessageReceiver {
    receiveMessage: (message: CommunicationWrapper<unknown>) => void;
    actionCode: ActionCode[];
}
