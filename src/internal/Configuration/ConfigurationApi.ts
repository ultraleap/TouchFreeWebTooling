import {
    ActionCode,
    CommunicationWrapper,
    ConfigState,
    ConnectionManager,
    InteractionConfig,
    PartialConfigState,
    PhysicalConfig,
    WebSocketResponse,
} from '../index';
import { v4 as uuidgen } from 'uuid';

/**
 * Send updated configuration to the TouchFree Service
 *
 * @remarks
 * WARNING! If a user changes ANY values via the TouchFree Service Settings UI,
 * all values set from the Tooling via this function will be discarded.
 * @param interaction - Optional interaction config modifications to send
 * @param physical - Optional physical config modifications to send
 * @param callback - Optional callback confirming a response from the service
 *
 * @public
 */
export function requestConfigChange(
    interaction: Partial<InteractionConfig> | null,
    physical: Partial<PhysicalConfig> | null,
    callback?: (detail: WebSocketResponse) => void
): void {
    baseConfigChangeRequest(interaction, physical, ActionCode.SET_CONFIGURATION_STATE, callback);
}

/**
 * Request active configuration state of the TouchFree Service
 * @param callback - Callback with the requested {@link ConfigState}
 *
 * @public
 */
export function requestConfigState(callback?: (detail: ConfigState) => void): void {
    if (!callback) {
        console.error('Config state request failed. This call requires a callback.');
        return;
    }

    ConnectionManager.serviceConnection()?.requestConfigState(callback);
}

/**
 * Requests a modification to the configuration **files** used by the TouchFree Service.
 *
 * @remarks
 * WARNING! Any changes that have been made using {@link requestConfigChange}
 * by *any* connected client will be lost when changing these files.
 * The change will be applied **to the current config files directly**,
 * disregarding current active config state.
 * @param interaction - Optional interaction config modifications to send
 * @param physical - Optional physical config modifications to send
 * @param callback - Optional callback confirming a response from the service
 *
 * @public
 */
export function requestConfigFileChange(
    interaction: Partial<InteractionConfig> | null,
    physical: Partial<PhysicalConfig> | null,
    callback?: (detail: WebSocketResponse) => void
): void {
    baseConfigChangeRequest(interaction, physical, ActionCode.SET_CONFIGURATION_FILE, callback);
}

/**
 * Request configuration state of the services config files.
 * @param callback - Callback with the requested {@link ConfigState}
 *
 * @public
 */
export function requestConfigFileState(callback?: (detail: ConfigState) => void): void {
    if (!callback) {
        console.error('Config file state request failed. This call requires a callback.');
        return;
    }

    ConnectionManager.serviceConnection()?.requestConfigFile(callback);
}

/**
 * Requests service to reset the interaction config file to it's default state
 *
 * @remarks
 * WARNING! Any changes that have been made using {@link requestConfigChange}
 * by *any* connected client will be lost when changing these files.
 * The change will be applied **to the current config files directly**,
 * disregarding current active config state.
 * @param callback - callback containing the new {@link ConfigState}
 *
 * @public
 */
export function resetInteractionConfigFileToDefault(callback?: (newState: ConfigState) => void): void {
    ConnectionManager.serviceConnection()?.resetInteractionConfigFile(callback);
}

function baseConfigChangeRequest(
    interaction: Partial<InteractionConfig> | null,
    physical: Partial<PhysicalConfig> | null,
    action: ActionCode,
    callback?: (detail: WebSocketResponse) => void
): void {
    const requestID = uuidgen();

    const content = new PartialConfigState(requestID, interaction, physical);
    const request = new CommunicationWrapper(action, content);

    const jsonContent = JSON.stringify(request);

    ConnectionManager.serviceConnection()?.sendMessage(jsonContent, requestID, callback);
}
