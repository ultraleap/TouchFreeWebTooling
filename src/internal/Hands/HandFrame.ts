import { Vector } from '../index';

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
