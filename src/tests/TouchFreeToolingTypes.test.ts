import {
    _BitmaskFlags,
    FlagUtilities,
    HandChirality,
    HandType,
    InputType,
    InteractionType,
} from '../TouchFreeToolingTypes';

// TODO: Generate enum values from types themselves?

const interactionTypes: InteractionType[] = [
    InteractionType.GRAB,
    InteractionType.HOVER,
    InteractionType.PUSH,
    InteractionType.TOUCHPLANE,
    InteractionType.VELOCITYSWIPE,
];
const handTypes: HandType[] = [HandType.PRIMARY, HandType.SECONDARY];
const handChiralities: HandChirality[] = [HandChirality.LEFT, HandChirality.RIGHT];
const inputTypes: InputType[] = [InputType.CANCEL, InputType.DOWN, InputType.MOVE, InputType.NONE, InputType.UP];

const allHandChiralityBitmask: _BitmaskFlags = _BitmaskFlags.LEFT | _BitmaskFlags.RIGHT;
const allHandTypeBitmask: _BitmaskFlags = _BitmaskFlags.PRIMARY | _BitmaskFlags.SECONDARY;
const allInputTypeBitmask: _BitmaskFlags =
    _BitmaskFlags.NONE_INPUT | _BitmaskFlags.CANCEL | _BitmaskFlags.DOWN | _BitmaskFlags.MOVE | _BitmaskFlags.UP;
const allInteractionTypeBitmask: _BitmaskFlags =
    _BitmaskFlags.GRAB |
    _BitmaskFlags.HOVER |
    _BitmaskFlags.PUSH |
    _BitmaskFlags.TOUCHPLANE |
    _BitmaskFlags.VELOCITYSWIPE;
const bitmaskFlagParams: _BitmaskFlags[] = [
    // The parameters here are hand-written and non-exhaustive as the cost
    // of exhaustive combinations in maintenance and performance is excessive

    // All set
    allHandChiralityBitmask | allHandTypeBitmask | allInputTypeBitmask | allInteractionTypeBitmask,
    // Individual values
    _BitmaskFlags.LEFT,
    _BitmaskFlags.RIGHT,

    _BitmaskFlags.PRIMARY,
    _BitmaskFlags.SECONDARY,

    _BitmaskFlags.NONE_INPUT,
    _BitmaskFlags.CANCEL,
    _BitmaskFlags.DOWN,
    _BitmaskFlags.MOVE,
    _BitmaskFlags.UP,

    _BitmaskFlags.GRAB,
    _BitmaskFlags.HOVER,
    _BitmaskFlags.PUSH,
    _BitmaskFlags.TOUCHPLANE,
    _BitmaskFlags.VELOCITYSWIPE,
    // One of each enum
    _BitmaskFlags.LEFT | _BitmaskFlags.PRIMARY | _BitmaskFlags.DOWN | _BitmaskFlags.GRAB,
    _BitmaskFlags.RIGHT | _BitmaskFlags.SECONDARY | _BitmaskFlags.NONE_INPUT | _BitmaskFlags.TOUCHPLANE,
    _BitmaskFlags.LEFT | _BitmaskFlags.SECONDARY | _BitmaskFlags.UP | _BitmaskFlags.VELOCITYSWIPE,
    _BitmaskFlags.RIGHT | _BitmaskFlags.PRIMARY | _BitmaskFlags.HOVER | _BitmaskFlags.PUSH,
    // Multiple of same enum set
    allHandChiralityBitmask,
    allHandTypeBitmask,
    allInputTypeBitmask,
    allInteractionTypeBitmask,
    // Nothing set
    _BitmaskFlags.NONE,
];

describe('BitmaskFlag', () => {
    // Suppress errors from console and store them in an array which we print only if a test fails
    const errors: string[] = [];
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation((msg: string) => errors.push(msg));

    it('should combine the same as before', () => {
        expect(FlagUtilities.GetInteractionFlags).toVerifyAllCombinations(
            interactionTypes,
            handTypes,
            handChiralities,
            inputTypes
        );
    });

    it('should deserialize hand chirality the same as before', () => {
        expect(FlagUtilities.GetChiralityFromFlags).toVerifyAllCombinations(bitmaskFlagParams);
    });

    it('should deserialize hand type the same as before', () => {
        expect(FlagUtilities.GetHandTypeFromFlags).toVerifyAllCombinations(bitmaskFlagParams);
    });

    it('should deserialize input type the same as before', () => {
        expect(FlagUtilities.GetInputTypeFromFlags).toVerifyAllCombinations(bitmaskFlagParams);
    });

    it('should deserialize interaction type the same as before', () => {
        expect(FlagUtilities.GetInteractionTypeFromFlags).toVerifyAllCombinations(bitmaskFlagParams);
    });

    afterAll(() => {
        consoleErrorMock.mockRestore();
        // If not all tests pass then log the errors
        const JEST_MATCHER = Symbol.for('$$jest-matchers-object');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const numberOfNonMatches: number | undefined = (global as any)[JEST_MATCHER]?.state?.snapshotState?.unmatched;
        if (numberOfNonMatches && numberOfNonMatches > 0) {
            console.log(errors);
        }
    });
});
