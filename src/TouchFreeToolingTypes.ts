import { LicenseState } from 'Licensing/Licensing';
import { Vector, Vector2 } from './Configuration/ConfigurationTypes';
import { ServiceStatus } from './Connection/TouchFreeServiceTypes';

/**
 * This class is used when comparing the {@link ApiVersion} of the Tooling and the Service.
 *
 * @internal
 */
export class VersionInfo {
    /**
     * The current version of communication API used between Tooling and the TouchFree Service
     */
    public static readonly ApiVersion: string = '1.6.0';

    /**
     * The name of the header we wish the Service to compare our version with.
     */
    public static readonly API_HEADER_NAME: string = 'TfApiVersion';
}

/**
 * A structure representing the Tooling version of an InputAction.
 *
 * @remarks
 * This is used to pass key information relating to an action that has happened on the Service.
 *
 * @public
 */
export class TouchFreeInputAction {
    /** Timestamp of action */
    Timestamp: number;
    /** Type of interaction. See {@link InteractionType} */
    InteractionType: InteractionType;
    /** Type of Hand. See {@link HandType} */
    HandType: HandType;
    /** Hand Chirality or handiness . See {@link HandChirality} */
    Chirality: HandChirality;
    /** Type of input. See {@link InputType} */
    InputType: InputType;
    /** Position of cursor in [x,y] */
    CursorPosition: Array<number>;
    /** Distance the hand is from screen in M */
    DistanceFromScreen: number;
    /** How close the action is to triggering a click between 0 (no click) and 1 (click) */
    ProgressToClick: number;

    constructor(
        _timestamp: number,
        _interactionType: InteractionType,
        _handType: HandType,
        _handChirality: HandChirality,
        _inputType: InputType,
        _cursorPosition: Array<number>,
        _distanceFromScreen: number,
        _progressToClick: number
    ) {
        this.Timestamp = _timestamp;
        this.InteractionType = _interactionType;
        this.HandType = _handType;
        this.Chirality = _handChirality;
        this.InputType = _inputType;
        this.CursorPosition = _cursorPosition;
        this.DistanceFromScreen = _distanceFromScreen;
        this.ProgressToClick = _progressToClick;
    }
}

/**
 * Converts a {@link WebsocketInputAction} into the Tooling-friendly {@link TouchFreeInputAction}.
 *
 * @param _wsInput - Raw input action received by the WebSocket
 * @returns User friendly conversion of the InputAction - {@link TouchFreeInputAction}
 *
 * @internal
 */
export function ConvertInputAction(_wsInput: WebsocketInputAction): TouchFreeInputAction {
    const yPosition = window.innerHeight - _wsInput.CursorPosition.y / window.devicePixelRatio;
    const xPosition = _wsInput.CursorPosition.x / window.devicePixelRatio;

    return new TouchFreeInputAction(
        _wsInput.Timestamp,
        FlagUtilities.GetInteractionTypeFromFlags(_wsInput.InteractionFlags),
        FlagUtilities.GetHandTypeFromFlags(_wsInput.InteractionFlags),
        FlagUtilities.GetChiralityFromFlags(_wsInput.InteractionFlags),
        FlagUtilities.GetInputTypeFromFlags(_wsInput.InteractionFlags),
        [xPosition, yPosition],
        _wsInput.DistanceFromScreen,
        _wsInput.ProgressToClick
    );
}

/**
 * a.k.a. Handedness
 * @public
 */
export enum HandChirality {
    /** Left hand */
    LEFT,
    /** Right hand */
    RIGHT,
}

/**
 * Type of hand in order they were recognized
 * @public
 */
export enum HandType {
    /** First hand that was found */
    PRIMARY,
    /** Second hand that was found */
    SECONDARY,
}

/**
 * Type of an InputAction
 * @public
 */
export enum InputType {
    /** Used to be ignored by the input system but to still receive information such as distance to screen */
    NONE,
    /** Used to cancel the current input if an issue occurs. Particularly when a DOWN has happened before an UP */
    CANCEL,
    /** Used to begin a 'Touch' or a 'Drag' */
    DOWN,
    /** Used to move a cursor or to perform a 'Drag' after a DOWN */
    MOVE,
    /** Used to complete a 'Touch' or a 'Drag' */
    UP,
}

/**
 * TouchFree interaction type
 * @public
 */
export enum InteractionType {
    /**
     * The user must perform a GRAB gesture to 'Touch' by bringing their fingers and thumb together
     * @internal
     */
    GRAB,
    /** The user must perform a HOVER gesture to 'Touch' by holding their hand still for a fixed time */
    HOVER,
    /** The user must perform a PUSH gesture to 'Touch' by pushing their hand toward the screen */
    PUSH,
    /** The user must perform a move past a plane in space to 'Touch' */
    TOUCHPLANE,
    /**
     * The user must perform a SWIPE gesture to 'Touch' by moving their hand quickly up, down, left or right
     * @internal
     */
    VELOCITYSWIPE,
}

/**
 * State of the Ultraleap Tracking Service that TouchFree Service connects to
 * @public
 */
export enum TrackingServiceState {
    /** The TouchFree service is not connected to the tracking service */
    UNAVAILABLE,
    /** The TouchFree service is connected to the tracking service but there is not a camera connected */
    NO_CAMERA,
    /** The TouchFree service is connected to the tracking service */
    CONNECTED,
}

/**
 * State of a configuration file
 * @public
 */
export enum ConfigurationState {
    /** The TouchFree configuration has not been loaded */
    NOT_LOADED,
    /** The TouchFree configuration has successfully been loaded */
    LOADED,
    /** The TouchFree configuration errored on load */
    ERRORED,
}

/**
 * Used to request a combination of the {@link HandChirality}, {@link HandType},
 * {@link InputType}, and {@link InteractionType} flags from the Service at once.
 * @internal
 */
export enum BitmaskFlags {
    /** No flags */
    NONE = 0,

    /** Left hand flag */
    LEFT = 1,
    /** Right hand flag */
    RIGHT = 2,

    /** Primary hand flag */
    PRIMARY = 4,
    /** Secondary hand flag */
    SECONDARY = 8,

    /** No input flag */
    NONE_INPUT = 16,
    /** Cancel input flag */
    CANCEL = 32,
    /** Down input flag */
    DOWN = 64,
    /** Move input flag */
    MOVE = 128,
    /** Up input flag */
    UP = 256,

    /**
     * Grab interaction flag
     * @internal
     */
    GRAB = 512,
    /** Hover interaction flag */
    HOVER = 1024,
    /** Push interaction flag */
    PUSH = 2048,
    /** TouchPlane interaction flag */
    TOUCHPLANE = 4096,
    /**
     * VelocitySwipe interaction flag
     * @internal
     * */
    VELOCITYSWIPE = 8192,
    // Adding elements to this list is a breaking change, and should cause at
    // least a minor iteration of the API version UNLESS adding them at the end
}

/**
 * Names and signatures of all TouchFree events
 * @public
 */
export interface TouchFreeEventSignatures {
    /**
     * Event dispatched when connecting to the TouchFree service
     */
    OnConnected: () => void;
    /**
     * Same as OnConnected but calls callback when already connected.
     * Note this event piggybacks as an "OnConnected" event on event targets.
     */
    WhenConnected: () => void;
    /**
     * Event dispatched when the connection between TouchFreeService and Ultraleap Tracking Service changes
     */
    OnTrackingServiceStateChange: (state: TrackingServiceState) => void;
    /**
     * Event dispatched when the status of TouchFree Service changes
     */
    OnServiceStatusChange: (state: ServiceStatus) => void;
    /**
     * Event dispatched when the first hand has started tracking
     */
    HandFound: () => void;
    /**
     * Event dispatched when the last hand has stopped tracking
     */
    HandsLost: () => void;
    /**
     * Event dispatched when new hand data is available
     *
     * @remarks
     * Hand data in this event is in a non-standard space intended
     * for specific purposes. Not intended for general user consumption.
     *
     * @internal
     */
    TransmitHandData: (data: HandFrame) => void;
    /**
     * Event dispatched when any input action is received from the TouchFree service
     */
    InputAction: (inputAction: TouchFreeInputAction) => void;
    /**
     * Event dispatched directly from the `InputActionManager` without any proxying
     */
    TransmitInputActionRaw: (inputAction: TouchFreeInputAction) => void;
    /**
     * Event dispatched from the `InputActionManager` to each registered Plugin
     */
    TransmitInputAction: (inputAction: TouchFreeInputAction) => void;
    /**
     * Event dispatched when the active hand enters the interaction zone
     */
    HandEntered: () => void;
    /**
     * Event dispatched when the active hand enters the interaction zone
     */
    HandExited: () => void;
    /**
     * Event dispatched when the Licensing state of TouchFree Service changes
     */
    OnLicenseStateChange: (state: LicenseState) => void;
}

/**
 * String literal union type of all events
 * @public
 */
export type TouchFreeEvent = Extract<keyof TouchFreeEventSignatures, string>;

/**
 * The version of an InputAction received via the WebSocket. This must be converted into a
 * {@link TouchFreeInputAction} to be used by the Tooling and can be done so via {@link ConvertInputAction}.
 *
 * @internal
 */
export class WebsocketInputAction {
    /** Timestamp */
    Timestamp: number;
    /** InteractionFlags */
    InteractionFlags: BitmaskFlags;
    /** CursorPosition */
    CursorPosition: Vector2;
    /** DistanceFromScreen */
    DistanceFromScreen: number;
    /** ProgressToClick between 0 and 1 */
    ProgressToClick: number;

    constructor(
        _timestamp: number,
        _interactionFlags: BitmaskFlags,
        _cursorPosition: Vector2,
        _distanceFromScreen: number,
        _progressToClick: number
    ) {
        this.Timestamp = _timestamp;
        this.InteractionFlags = _interactionFlags;
        this.CursorPosition = _cursorPosition;
        this.DistanceFromScreen = _distanceFromScreen;
        this.ProgressToClick = _progressToClick;
    }
}

/**
 * A frame of hand data
 * @internal
 */
export class HandFrame {
    /** Array of {@link RawHand | hand data} */
    Hands: RawHand[] = [];
}

/**
 * The raw position data for a hand
 * @internal
 */
export class RawHand {
    /** Flag representing if hand is the current primary hand */
    CurrentPrimary = false;
    /** Array of {@link RawFinger | fingers} */
    Fingers: RawFinger[] = [];
    /** Width of wrist */
    WristWidth = 0;
    /** Position of wrist */
    WristPosition: Vector = { X: 0, Y: 0, Z: 0 };
}

/**
 * The raw position data for a finger of a hand
 * @internal
 */
export class RawFinger {
    /** Array of {@link RawBone | Bones}  */
    Bones: RawBone[] = [];
    /** Type of finger. See {@link FingerType} */
    Type: FingerType = FingerType.TYPE_UNKNOWN;
}

/**
 * Enumeration of fingers on a hand
 * @internal
 */
export enum FingerType {
    /** Thumb */
    TYPE_THUMB = 0,
    /** Index Finger */
    TYPE_INDEX = 1,
    /** Middle Finger */
    TYPE_MIDDLE = 2,
    /** Ring Finger */
    TYPE_RING = 3,
    /** Pinky Finger */
    TYPE_PINKY = 4,
    /** Unknown Finger */
    TYPE_UNKNOWN = -1,
}

/**
 * The raw position data for a bone in a finger
 * @internal
 */
export class RawBone {
    /** Start joint position of the finger bone */
    PrevJoint: Vector = { X: 0, Y: 0, Z: 0 };
    /** End joint position of the finger bone */
    NextJoint: Vector = { X: 0, Y: 0, Z: 0 };
}

/**
 * A collection of Utilities to be used when working with BitmaskFlags
 * @internal
 */
export class FlagUtilities {
    /**
     * Convert a collection of interaction enums to BitmaskFlags for sending to the Service
     */
    static GetInteractionFlags(
        _interactionType: InteractionType,
        _handType: HandType,
        _chirality: HandChirality,
        _inputType: InputType
    ): BitmaskFlags {
        let returnVal: BitmaskFlags = BitmaskFlags.NONE;

        switch (_handType) {
            case HandType.PRIMARY:
                returnVal ^= BitmaskFlags.PRIMARY;
                break;

            case HandType.SECONDARY:
                returnVal ^= BitmaskFlags.SECONDARY;
                break;
        }

        switch (_chirality) {
            case HandChirality.LEFT:
                returnVal ^= BitmaskFlags.LEFT;
                break;

            case HandChirality.RIGHT:
                returnVal ^= BitmaskFlags.RIGHT;
                break;
        }

        switch (_inputType) {
            case InputType.NONE:
                returnVal ^= BitmaskFlags.NONE_INPUT;
                break;

            case InputType.CANCEL:
                returnVal ^= BitmaskFlags.CANCEL;
                break;

            case InputType.MOVE:
                returnVal ^= BitmaskFlags.MOVE;
                break;

            case InputType.UP:
                returnVal ^= BitmaskFlags.UP;
                break;

            case InputType.DOWN:
                returnVal ^= BitmaskFlags.DOWN;
                break;
        }

        switch (_interactionType) {
            case InteractionType.PUSH:
                returnVal ^= BitmaskFlags.PUSH;
                break;

            case InteractionType.HOVER:
                returnVal ^= BitmaskFlags.HOVER;
                break;

            case InteractionType.GRAB:
                returnVal ^= BitmaskFlags.GRAB;
                break;

            case InteractionType.TOUCHPLANE:
                returnVal ^= BitmaskFlags.TOUCHPLANE;
                break;

            case InteractionType.VELOCITYSWIPE:
                returnVal ^= BitmaskFlags.VELOCITYSWIPE;
                break;
        }

        return returnVal;
    }

    /**
     * Extract HandChirality from a BitmaskFlags
     * @remarks Favours RIGHT if none or both are found
     * @param _flags - BitmaskFlags to extract from
     * @returns Extracted chirality
     */
    static GetChiralityFromFlags(_flags: BitmaskFlags): HandChirality {
        let chirality: HandChirality = HandChirality.RIGHT;

        if (_flags & BitmaskFlags.RIGHT) {
            chirality = HandChirality.RIGHT;
        } else if (_flags & BitmaskFlags.LEFT) {
            chirality = HandChirality.LEFT;
        } else {
            console.error("InputActionData missing: No Chirality found. Defaulting to 'RIGHT'");
        }

        return chirality;
    }

    /**
     * Extract HandType from a BitmaskFlags
     * @remarks Favours PRIMARY if none or both are found
     * @param _flags - BitmaskFlags to extract from
     * @returns Extracted hand type
     */
    static GetHandTypeFromFlags(_flags: BitmaskFlags): HandType {
        let handType: HandType = HandType.PRIMARY;

        if (_flags & BitmaskFlags.PRIMARY) {
            handType = HandType.PRIMARY;
        } else if (_flags & BitmaskFlags.SECONDARY) {
            handType = HandType.SECONDARY;
        } else {
            console.error("InputActionData missing: No HandData found. Defaulting to 'PRIMARY'");
        }

        return handType;
    }

    /**
     * Extract InputType from a BitmaskFlags
     * @remarks Favours NONE if none are found
     * @param _flags - BitmaskFlags to extract from
     * @returns Extracted input type
     */
    static GetInputTypeFromFlags(_flags: BitmaskFlags): InputType {
        let inputType: InputType = InputType.NONE;

        if (_flags & BitmaskFlags.NONE_INPUT) {
            inputType = InputType.NONE;
        } else if (_flags & BitmaskFlags.CANCEL) {
            inputType = InputType.CANCEL;
        } else if (_flags & BitmaskFlags.UP) {
            inputType = InputType.UP;
        } else if (_flags & BitmaskFlags.DOWN) {
            inputType = InputType.DOWN;
        } else if (_flags & BitmaskFlags.MOVE) {
            inputType = InputType.MOVE;
        } else {
            console.error("InputActionData missing: No InputType found. Defaulting to 'NONE'");
        }

        return inputType;
    }

    /**
     * Extract InteractionType from a BitmaskFlags
     * @remarks Favours PUSH if none are found
     * @param _flags - BitmaskFlags to extract from
     * @returns Extracted interaction type
     */
    static GetInteractionTypeFromFlags(_flags: BitmaskFlags): InteractionType {
        let interactionType: InteractionType = InteractionType.PUSH;

        if (_flags & BitmaskFlags.PUSH) {
            interactionType = InteractionType.PUSH;
        } else if (_flags & BitmaskFlags.HOVER) {
            interactionType = InteractionType.HOVER;
        } else if (_flags & BitmaskFlags.GRAB) {
            interactionType = InteractionType.GRAB;
        } else if (_flags & BitmaskFlags.TOUCHPLANE) {
            interactionType = InteractionType.TOUCHPLANE;
        } else if (_flags & BitmaskFlags.VELOCITYSWIPE) {
            interactionType = InteractionType.VELOCITYSWIPE;
        } else {
            console.error("InputActionData missing: No InteractionType found. Defaulting to 'PUSH'");
        }

        return interactionType;
    }
}
