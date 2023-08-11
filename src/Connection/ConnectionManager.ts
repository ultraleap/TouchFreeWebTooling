import TouchFree, { dispatchEvent } from '../TouchFree';
import { TrackingServiceState } from '../TouchFreeToolingTypes';
import { MessageReceiver } from './MessageReceiver';
import { ServiceConnection } from './ServiceConnection';
import { HandPresenceState, InteractionZoneState, ServiceStatus } from './TouchFreeServiceTypes';

/**
 * Custom IP and port to connect to Service on
 */
export interface Address {
    /** Optional IP Address */
    ip?: string;
    /** Optional Port */
    port?: string;
}

interface InitParams {
    address?: Address;
}

/**
 * Manages the connection to the Service
 *
 * @remarks
 * Dispatches an `"OnConnected"` event when connecting to the service.
 *
 * @public
 */
export class ConnectionManager extends EventTarget {
    /** The private reference to the currently managed `ServiceConnection`. */
    private static currentServiceConnection: ServiceConnection | null = null;

    /**
     * Getter for currently managed static `ServiceConnection`.
     *
     * @internal
     */
    public static serviceConnection(): ServiceConnection | null {
        return ConnectionManager.currentServiceConnection;
    }

    /**
     * Global static reference to message receiver
     *
     * @internal
     */
    public static messageReceiver: MessageReceiver;

    /**
     * Global static instance of this manager
     */
    public static instance: ConnectionManager;

    /**
     * The IP Address that will be used in the `ServiceConnection` to connect to the target WebSocket.
     */
    static ipAddress = '127.0.0.1';

    /**
     * The Port that will be used in the `ServiceConnection` to connect to the target WebSocket.
     */
    static port = '9739';

    /**
     * Private reference to the current hand presence state
     */
    private static currentHandPresence: HandPresenceState = HandPresenceState.HANDS_LOST;

    /**
     * Private reference to the current interaction zone state
     */
    private static currentInteractionZoneState: InteractionZoneState = InteractionZoneState.HAND_EXITED;

    /**
     * Creates global {@link MessageReceiver} and {@link ConnectionManager} instance
     * and attempts to connect to the service.
     *
     * @remarks
     * This function is not reentrant - calling it a second time will overwrite
     * the previous global instance and connect again.
     */
    public static init(initParams?: InitParams) {
        ConnectionManager.messageReceiver = new MessageReceiver();
        ConnectionManager.instance = new ConnectionManager();
        if (initParams?.address) {
            ConnectionManager.setAddress(initParams.address);
        } else {
            ConnectionManager.connect();
        }
    }

    /**
     * Adds a listener for the `"OnConnected"` event.
     *
     * @remarks
     * Will call the passed function if already connected.
     *
     * @param onConnectFunc - Callback function to call when event is triggered
     *
     * @deprecated Use {@link TouchFree.registerEventCallback} 'WhenConnected'
     */
    public static addConnectionListener(onConnectFunc: () => void): void {
        TouchFree.registerEventCallback('whenConnected', onConnectFunc);
    }

    /**
     * Are we currently connected to the service?
     */
    public static get isConnected(): boolean {
        return (
            ConnectionManager.currentServiceConnection !== null &&
            ConnectionManager.currentServiceConnection.webSocket.readyState === WebSocket.OPEN &&
            ConnectionManager.currentServiceConnection.handshakeComplete
        );
    }

    /**
     * Adds a listener for the `"OnTrackingServiceStateChange"` event.
     *
     * @param serviceStatusFunc - Callback function to call when event is triggered
     *
     * @deprecated Use {@link TouchFree.registerEventCallback} 'OnTrackingServiceStateChange'
     */
    public static addServiceStatusListener(serviceStatusFunc: (serviceStatus: TrackingServiceState) => void): void {
        TouchFree.registerEventCallback('onTrackingServiceStateChange', serviceStatusFunc);
    }

    /**
     * Creates a new {@link ServiceConnection} using {@link ipAddress} and {@link port}.
     * A successful connection will dispatch the `"OnConnected"` event.
     */
    public static connect(): void {
        ConnectionManager.currentServiceConnection = new ServiceConnection(
            ConnectionManager.ipAddress,
            ConnectionManager.port
        );
    }

    /**
     * Handles HandPresence events from the service and dispatches
     * the `HandFound` and `HandsLost` events on this class
     * @param state - Hand state
     */
    public static handleHandPresenceEvent(state: HandPresenceState): void {
        ConnectionManager.currentHandPresence = state;

        if (state === HandPresenceState.HAND_FOUND) {
            dispatchEvent('handFound');
        } else {
            dispatchEvent('handsLost');
        }
    }

    /**
     * Handle an InteractionZone event by dispatching
     * `HandEntered` and `HandsExited` events on this class
     */
    public static handleInteractionZoneEvent(state: InteractionZoneState): void {
        ConnectionManager.currentInteractionZoneState = state;

        if (state === InteractionZoneState.HAND_ENTERED) {
            TouchFree.dispatchEvent('handEntered');
        } else {
            TouchFree.dispatchEvent('handExited');
        }
    }

    /**
     * Disconnects service connection and sets it to null.
     */
    public static disconnect(): void {
        if (ConnectionManager.currentServiceConnection !== null) {
            ConnectionManager.currentServiceConnection.disconnect();
            ConnectionManager.currentServiceConnection = null;
        }
    }

    /**
     * Request service status from the service
     * @param callback - Callback to call with the response
     */
    public static requestServiceStatus(callback: (detail: ServiceStatus) => void): void {
        if (callback === null) {
            console.error('Request failed. This is due to a missing callback');
            return;
        }

        ConnectionManager.serviceConnection()?.requestServiceStatus(callback);
    }

    /**
     * Get current presence state of the hand.
     */
    public static getCurrentHandPresence(): HandPresenceState {
        return ConnectionManager.currentHandPresence;
    }

    /**
     * get current interaction zone state
     */
    public static getCurrentInteractionZoneState(): InteractionZoneState {
        return ConnectionManager.currentInteractionZoneState;
    }

    /**
     * Set the ip and port that Tooling should attempt to connect to the Service via
     */
    public static setAddress(address: Address): void {
        ConnectionManager.ipAddress = address.ip ?? '127.0.0.1';
        ConnectionManager.port = address.port ?? '9739';
        ConnectionManager.disconnect();
        ConnectionManager.connect();
    }
}
