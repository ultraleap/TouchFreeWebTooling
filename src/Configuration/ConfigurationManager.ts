import { ConnectionManager } from '../Connection';
import {
    ActionCode,
    CommunicationWrapper,
    ConfigState,
    PartialConfigState,
    WebSocketResponse,
} from '../Connection/TouchFreeServiceTypes';
import { InteractionConfig, PhysicalConfig } from './ConfigurationTypes';
import { v4 as uuidgen } from 'uuid';

/**
 * Provides methods for changing the configuration of the TouchFree Service.
 * @public
 */
export class ConfigurationManager {
    /**
     * Send updated configuration to the TouchFree Service
     *
     * @remarks
     * WARNING! If a user changes ANY values via the TouchFree Service Settings UI,
     * all values set from the Tooling via this function will be discarded.
     * @param interaction - Optional interaction config modifications to send
     * @param physical - Optional physical config modifications to send
     * @param callback - Optional callback confirming a response from the service
     */
    public static requestConfigChange(
        interaction: Partial<InteractionConfig> | null,
        physical: Partial<PhysicalConfig> | null,
        callback: (detail: WebSocketResponse) => void
    ): void {
        ConfigurationManager.baseConfigChangeRequest(
            interaction,
            physical,
            callback,
            ActionCode.SET_CONFIGURATION_STATE
        );
    }

    /**
     * Request active configuration state of the TouchFree Service
     * @param callback - Callback with the requested {@link ConfigState}
     */
    public static requestConfigState(callback: (detail: ConfigState) => void): void {
        if (callback === null) {
            console.error('Config state request failed. This call requires a callback.');
            return;
        }

        ConnectionManager.serviceConnection()?.requestConfigState(callback);
    }

    /**
     * Requests a modification to the configuration **files** used by the TouchFree Service.
     *
     * @remarks
     * WARNING! Any changes that have been made using {@link RequestConfigChange}
     * by *any* connected client will be lost when changing these files.
     * The change will be applied **to the current config files directly**,
     * disregarding current active config state.
     * @param interaction - Optional interaction config modifications to send
     * @param physical - Optional physical config modifications to send
     * @param callback - Optional callback confirming a response from the service
     */
    public static requestConfigFileChange(
        interaction: Partial<InteractionConfig> | null,
        physical: Partial<PhysicalConfig> | null,
        callback: (detail: WebSocketResponse) => void | null
    ): void {
        ConfigurationManager.baseConfigChangeRequest(
            interaction,
            physical,
            callback,
            ActionCode.SET_CONFIGURATION_FILE
        );
    }

    /**
     * Requests service to reset the interaction config file to it's default state
     *
     * @remarks
     * WARNING! Any changes that have been made using {@link RequestConfigChange}
     * by *any* connected client will be lost when changing these files.
     * The change will be applied **to the current config files directly**,
     * disregarding current active config state.
     * @param callback - callback containing the new {@link ConfigState}
     */
    public static resetInteractionConfigFileToDefault(callback: (newState: ConfigState) => void): void {
        ConnectionManager.serviceConnection()?.resetInteractionConfigFile(callback);
    }

    private static baseConfigChangeRequest(
        interaction: Partial<InteractionConfig> | null,
        physical: Partial<PhysicalConfig> | null,
        callback: (detail: WebSocketResponse) => void | null,
        action: ActionCode
    ): void {
        const requestID = uuidgen();

        const content = new PartialConfigState(requestID, interaction, physical);
        const request = new CommunicationWrapper(action, content);

        const jsonContent = JSON.stringify(request);

        ConnectionManager.serviceConnection()?.sendMessage(jsonContent, requestID, callback);
    }

    /**
     * Request configuration state of the services config files.
     * @param callback - Callback with the requested {@link ConfigState}
     */
    public static requestConfigFileState(callback: (detail: ConfigState) => void): void {
        if (callback === null) {
            console.error('Config file state request failed. This call requires a callback.');
            return;
        }

        ConnectionManager.serviceConnection()?.requestConfigFile(callback);
    }
}
