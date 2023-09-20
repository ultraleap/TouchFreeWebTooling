import {
    type TouchFreeInputAction,
    InteractionType,
    HandType,
    HandChirality,
    InputType,
} from '../InputActions/InputAction';
import { InputActionManager } from '../InputActions/InputActionManager';
import { dispatchEventCallback } from '../TouchFreeEvents/TouchFreeEvents';

export const createInputAction = (input?: Partial<TouchFreeInputAction>) => ({
    Timestamp: input?.Timestamp ?? Date.now(),
    InteractionType: input?.InteractionType ?? InteractionType.PUSH,
    HandType: input?.HandType ?? HandType.PRIMARY,
    Chirality: input?.Chirality ?? HandChirality.RIGHT,
    InputType: input?.InputType ?? InputType.MOVE,
    CursorPosition: input?.CursorPosition ?? [0, 0],
    DistanceFromScreen: input?.DistanceFromScreen ?? 5,
    ProgressToClick: input?.ProgressToClick ?? 0,
});

export const mockTfInputAction = (input?: Partial<TouchFreeInputAction>) =>
    dispatchEventCallback('transmitInputAction', createInputAction(input));

export const mockTfPluginPartialInputAction = (input?: Partial<TouchFreeInputAction>) =>
    InputActionManager.handleInputAction(createInputAction(input));

export const mockTfPluginInputAction = (input: TouchFreeInputAction) => InputActionManager.handleInputAction(input);

export const checkTwoInputActionsAreSame = (
    a: TouchFreeInputAction | null,
    b: TouchFreeInputAction | null
): boolean => {
    if (!a && !b) {
        return true;
    } else if (!a || !b) {
        throw new Error('Only one input action was null');
    }

    let passed = true;

    Object.keys(a).forEach((key) => {
        const castedKey = key as keyof TouchFreeInputAction;
        const valueA = a[castedKey];
        const valueB = b[castedKey];
        if (valueA !== valueB) passed = false;
        expect(valueA).toBe(valueB);
    });

    return passed;
};

export const copyInputAction = (input: TouchFreeInputAction): TouchFreeInputAction => Object.assign({}, input);

export const intervalTest = async (test: () => unknown) => {
    await new Promise<void>((resolve, reject) => {
        let time = 0;
        const interval = setInterval(() => {
            try {
                test();
                clearInterval(interval);
                resolve();
            } catch (e) {
                if (time > 1000) {
                    clearInterval(interval);
                    reject(e);
                }
                time += 20;
            }
        }, 20);
    });
};

export const sleep = async (timeoutMS: number) => await new Promise((resolve) => setTimeout(resolve, timeoutMS));

function getAllCombinations(paramsList: any[][] = []): any[][] {
    if (paramsList.length === 0) {
        return [];
    }

    const [firstParams, ...rest] = paramsList;
    if (rest.length === 0) {
        return firstParams.map((param: any) => [param]);
    }

    const combinations: any[] = [];

    getAllCombinations(rest).forEach((restCombination: any) => {
        firstParams.forEach((param: any) => {
            combinations.push([param].concat(restCombination));
        });
    });

    return combinations;
}

export function snapshotAllCombinations(fn: (...fnArgs: any) => any, ...args: any[][]) {
    const snapshot: { [k: string]: any } = {};

    getAllCombinations(args).forEach((combination) => {
        snapshot[combination.join(',')] = fn(...combination);
    });

    expect(snapshot).toMatchSnapshot();
}
