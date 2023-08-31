import { Address, ServiceState, convertResponseToServiceState } from './ConnectionTypes';
import { ServiceConnection } from './ServiceConnection';

/** The private reference to the currently managed `ServiceConnection`. */
let currentServiceConnection: ServiceConnection | null = null;

/** Default address to connect to the service websocket */
const defaultConnectionAddress: Address = { ip: '127.0.0.1', port: '9739' };

/** The address that will be used to connect to the service websocket */
let currentConnectionAddress: Address = defaultConnectionAddress;

/**
 * Are we connected to the TouchFree service?
 *
 * @returns Whether connected to TouchFree service or not.
 * @public
 */
export const isConnected = (): boolean => {
    return (
        currentServiceConnection !== null &&
        currentServiceConnection.webSocket.readyState === WebSocket.OPEN &&
        currentServiceConnection.handshakeComplete
    );
};

/**
 * Get the default address to to connect to the service websocket
 * @public
 */
export function getDefaultServiceAddress(): Address {
    return defaultConnectionAddress;
}

/**
 * Get the current address to to connect to the service websocket
 * @public
 */
export function getCurrentServiceAddress(): Address {
    return currentConnectionAddress;
}

/**
 * Getter for currently managed static `ServiceConnection`.
 *
 * @internal
 */
export function getServiceConnection(): ServiceConnection | null {
    return currentServiceConnection;
}

/**
 * Creates a new {@link ServiceConnection} using {@link Address}.
 * A successful connection will dispatch the `"onConnected"` event.
 * @public
 */
export function connect(address: Address = defaultConnectionAddress): void {
    currentServiceConnection = new ServiceConnection(address);
    currentConnectionAddress = address;
}

/**
 * Disconnects service connection and sets it to null.
 * @public
 */
export function disconnect(): void {
    if (currentServiceConnection !== null) {
        currentServiceConnection.disconnect();
        currentServiceConnection = null;
    }
}

/**
 * Request service status from the service
 * @param callback - Callback to call with the response
 * @public
 */
export function requestServiceStatus(callback?: (detail: ServiceState) => void): void {
    if (!callback) {
        console.error('Request failed. This is due to a missing callback');
        return;
    }

    getServiceConnection()?.requestServiceStatus((detail) => callback(convertResponseToServiceState(detail)));
}
