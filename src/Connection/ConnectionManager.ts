import TouchFree, { DispatchEvent } from '../TouchFree';
import { TrackingServiceState } from '../TouchFreeToolingTypes';
import { MessageReceiver } from './MessageReceiver';
import { ServiceConnection } from './ServiceConnection';
import { HandPresenceState, InteractionZoneState, ServiceStatus } from './TouchFreeServiceTypes';

export interface Address {
    ip?: string;
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
    static iPAddress = '127.0.0.1';

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
            ConnectionManager.SetAddress(initParams.address);
        } else {
            ConnectionManager.Connect();
        }
    }

    /**
     * Adds a listener for the `"OnConnected"` event.
     *
     * @remarks
     * Will call the passed function if already connected.
     *
     * @param _onConnectFunc - Callback function to call when event is triggered
     *
     * @deprecated Use {@link TouchFree.RegisterEventCallback} 'WhenConnected'
     */
    public static AddConnectionListener(_onConnectFunc: () => void): void {
        TouchFree.RegisterEventCallback('WhenConnected', _onConnectFunc);
    }

    /**
     * Are we currently connected to the service?
     */
    public static get IsConnected(): boolean {
        return (
            ConnectionManager.currentServiceConnection !== null &&
            ConnectionManager.currentServiceConnection.webSocket.readyState === WebSocket.OPEN &&
            ConnectionManager.currentServiceConnection.handshakeComplete
        );
    }

    /**
     * Adds a listener for the `"OnTrackingServiceStateChange"` event.
     *
     * @param _serviceStatusFunc - Callback function to call when event is triggered
     *
     * @deprecated Use {@link TouchFree.RegisterEventCallback} 'OnTrackingServiceStateChange'
     */
    public static AddServiceStatusListener(_serviceStatusFunc: (serviceStatus: TrackingServiceState) => void): void {
        TouchFree.RegisterEventCallback('OnTrackingServiceStateChange', _serviceStatusFunc);
    }

    /**
     * Creates a new {@link ServiceConnection} using {@link iPAddress} and {@link port}.
     * A successful connection will dispatch the `"OnConnected"` event.
     */
    public static Connect(): void {
        ConnectionManager.currentServiceConnection = new ServiceConnection(
            ConnectionManager.iPAddress,
            ConnectionManager.port
        );
    }

    /**
     * Handles HandPresence events from the service and dispatches
     * the `HandFound` and `HandsLost` events on this class
     * @param _state - Hand state
     */
    public static HandleHandPresenceEvent(_state: HandPresenceState): void {
        ConnectionManager.currentHandPresence = _state;

        if (_state === HandPresenceState.HAND_FOUND) {
            DispatchEvent('HandFound');
        } else {
            DispatchEvent('HandsLost');
        }
    }

    /**
     * Handle an InteractionZone event by dispatching
     * `HandEntered` and `HandsExited` events on this class
     */
    public static HandleInteractionZoneEvent(_state: InteractionZoneState): void {
        ConnectionManager.currentInteractionZoneState = _state;

        if (_state === InteractionZoneState.HAND_ENTERED) {
            TouchFree.DispatchEvent('HandEntered');
        } else {
            TouchFree.DispatchEvent('HandExited');
        }
    }

    /**
     * Disconnects service connection and sets it to null.
     */
    public static Disconnect(): void {
        if (ConnectionManager.currentServiceConnection !== null) {
            ConnectionManager.currentServiceConnection.Disconnect();
            ConnectionManager.currentServiceConnection = null;
        }
    }

    /**
     * Request service status from the service
     * @param _callback - Callback to call with the response
     */
    public static RequestServiceStatus(_callback: (detail: ServiceStatus) => void): void {
        if (_callback === null) {
            console.error('Request failed. This is due to a missing callback');
            return;
        }

        ConnectionManager.serviceConnection()?.RequestServiceStatus(_callback);
    }

    /**
     * Get current presence state of the hand.
     */
    public static GetCurrentHandPresence(): HandPresenceState {
        return ConnectionManager.currentHandPresence;
    }

    /**
     * Get current interaction zone state
     */
    public static GetCurrentInteractionZoneState(): InteractionZoneState {
        return ConnectionManager.currentInteractionZoneState;
    }

    /**
     * Set the ip and port that Tooling should attempt to connect to the Service via
     */
    public static SetAddress(address: Address): void {
        ConnectionManager.iPAddress = address.ip ?? '127.0.0.1';
        ConnectionManager.port = address.port ?? '9739';
        ConnectionManager.Disconnect();
        ConnectionManager.Connect();
    }
}
