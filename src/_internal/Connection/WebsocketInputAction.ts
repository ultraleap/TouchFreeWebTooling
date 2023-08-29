import { HandChirality, HandType, InputType, InteractionType, TouchFreeInputAction, Vector2 } from 'TouchFree';

/**
 * The version of an inputAction received via the WebSocket. This must be converted into a
 * {@link TouchFreeInputAction} to be used by the Tooling and can be done so via {@link convertInputAction}.
 *
 * @internal
 */
export class WebsocketInputAction {
    /** Timestamp of action */
    Timestamp: number;
    /** InteractionFlags */
    InteractionFlags: BitmaskFlags;
    /**
     * Position of cursor.
     * Given in Pixels.
     */
    CursorPosition: Vector2;
    /**
     * Distance the hand is from screen
     * Measured in Metres.
     */
    DistanceFromScreen: number;
    /** How close the action is to triggering a click between 0 (no click) and 1 (click) */
    ProgressToClick: number;

    constructor(
        timestamp: number,
        interactionFlags: BitmaskFlags,
        cursorPosition: Vector2,
        distanceFromScreen: number,
        progressToClick: number
    ) {
        this.Timestamp = timestamp;
        this.InteractionFlags = interactionFlags;
        this.CursorPosition = cursorPosition;
        this.DistanceFromScreen = distanceFromScreen;
        this.ProgressToClick = progressToClick;
    }
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
 * Converts a {@link WebsocketInputAction} into the Tooling-friendly {@link TouchFreeInputAction}.
 *
 * @param wsInput - Raw input action received by the WebSocket
 * @returns User friendly conversion of the inputAction - {@link TouchFreeInputAction}
 *
 * @internal
 */
export function convertInputAction(wsInput: WebsocketInputAction): TouchFreeInputAction {
    const yPosition = window.innerHeight - wsInput.CursorPosition.y / window.devicePixelRatio;
    const xPosition = wsInput.CursorPosition.x / window.devicePixelRatio;

    return new TouchFreeInputAction(
        wsInput.Timestamp,
        getInteractionTypeFromFlags(wsInput.InteractionFlags),
        getHandTypeFromFlags(wsInput.InteractionFlags),
        getChiralityFromFlags(wsInput.InteractionFlags),
        getInputTypeFromFlags(wsInput.InteractionFlags),
        [xPosition, yPosition],
        wsInput.DistanceFromScreen,
        wsInput.ProgressToClick
    );
}

/**
 * Convert a collection of interaction enums to BitmaskFlags for sending to the Service
 *
 * @internal
 */
export function getInteractionFlags(
    interactionType: InteractionType,
    handType: HandType,
    chirality: HandChirality,
    inputType: InputType
): BitmaskFlags {
    let returnVal: BitmaskFlags = BitmaskFlags.NONE;

    switch (handType) {
        case HandType.PRIMARY:
            returnVal ^= BitmaskFlags.PRIMARY;
            break;

        case HandType.SECONDARY:
            returnVal ^= BitmaskFlags.SECONDARY;
            break;
    }

    switch (chirality) {
        case HandChirality.LEFT:
            returnVal ^= BitmaskFlags.LEFT;
            break;

        case HandChirality.RIGHT:
            returnVal ^= BitmaskFlags.RIGHT;
            break;
    }

    switch (inputType) {
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

    switch (interactionType) {
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
 * @param flags - BitmaskFlags to extract from
 * @returns Extracted chirality
 *
 * @internal
 */
export function getChiralityFromFlags(flags: BitmaskFlags): HandChirality {
    let chirality: HandChirality = HandChirality.RIGHT;

    if (flags & BitmaskFlags.RIGHT) {
        chirality = HandChirality.RIGHT;
    } else if (flags & BitmaskFlags.LEFT) {
        chirality = HandChirality.LEFT;
    } else {
        console.error("InputActionData missing: No Chirality found. Defaulting to 'RIGHT'");
    }

    return chirality;
}

/**
 * Extract HandType from a BitmaskFlags
 * @remarks Favours PRIMARY if none or both are found
 * @param flags - BitmaskFlags to extract from
 * @returns Extracted hand type
 *
 * @internal
 */
export function getHandTypeFromFlags(flags: BitmaskFlags): HandType {
    let handType: HandType = HandType.PRIMARY;

    if (flags & BitmaskFlags.PRIMARY) {
        handType = HandType.PRIMARY;
    } else if (flags & BitmaskFlags.SECONDARY) {
        handType = HandType.SECONDARY;
    } else {
        console.error("InputActionData missing: No HandData found. Defaulting to 'PRIMARY'");
    }

    return handType;
}

/**
 * Extract InputType from a BitmaskFlags
 * @remarks Favours NONE if none are found
 * @param flags - BitmaskFlags to extract from
 * @returns Extracted input type
 *
 * @internal
 */
export function getInputTypeFromFlags(flags: BitmaskFlags): InputType {
    let inputType: InputType = InputType.NONE;

    if (flags & BitmaskFlags.NONE_INPUT) {
        inputType = InputType.NONE;
    } else if (flags & BitmaskFlags.CANCEL) {
        inputType = InputType.CANCEL;
    } else if (flags & BitmaskFlags.UP) {
        inputType = InputType.UP;
    } else if (flags & BitmaskFlags.DOWN) {
        inputType = InputType.DOWN;
    } else if (flags & BitmaskFlags.MOVE) {
        inputType = InputType.MOVE;
    } else {
        console.error("InputActionData missing: No InputType found. Defaulting to 'NONE'");
    }

    return inputType;
}

/**
 * Extract InteractionType from a BitmaskFlags
 * @remarks Favours PUSH if none are found
 * @param flags - BitmaskFlags to extract from
 * @returns Extracted interaction type
 *
 * @internal
 */
export function getInteractionTypeFromFlags(flags: BitmaskFlags): InteractionType {
    let interactionType: InteractionType = InteractionType.PUSH;

    if (flags & BitmaskFlags.PUSH) {
        interactionType = InteractionType.PUSH;
    } else if (flags & BitmaskFlags.HOVER) {
        interactionType = InteractionType.HOVER;
    } else if (flags & BitmaskFlags.GRAB) {
        interactionType = InteractionType.GRAB;
    } else if (flags & BitmaskFlags.TOUCHPLANE) {
        interactionType = InteractionType.TOUCHPLANE;
    } else if (flags & BitmaskFlags.VELOCITYSWIPE) {
        interactionType = InteractionType.VELOCITYSWIPE;
    } else {
        console.error("InputActionData missing: No InteractionType found. Defaulting to 'PUSH'");
    }

    return interactionType;
}
