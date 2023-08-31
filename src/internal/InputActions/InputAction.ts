/**
 * A structure representing the Tooling version of an inputAction.
 *
 * @remarks
 * This is used to pass key information relating to an action that has happened on the Service.
 *
 * @public
 */
export interface TouchFreeInputAction {
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
    /**
     * Position of cursor in [x,y].
     * Given in Pixels.
     */
    CursorPosition: Array<number>;
    /**
     * Distance the hand is from screen
     * Measured in Metres.
     */
    DistanceFromScreen: number;
    /** How close the action is to triggering a click between 0 (no click) and 1 (click) */
    ProgressToClick: number;
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
 * Type of an inputAction
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
