import { InputActionManager } from '../Plugins/InputActionManager';
import TouchFree from '../TouchFree';
import { TouchFreeInputAction, InteractionType, HandType, HandChirality, InputType } from '../TouchFreeToolingTypes';

export const createInputAction = (input?: Partial<TouchFreeInputAction>) =>
    new TouchFreeInputAction(
        input?.Timestamp ?? Date.now(),
        input?.InteractionType ?? InteractionType.PUSH,
        input?.HandType ?? HandType.PRIMARY,
        input?.Chirality ?? HandChirality.RIGHT,
        input?.InputType ?? InputType.MOVE,
        input?.CursorPosition ?? [0, 0],
        input?.DistanceFromScreen ?? 5,
        input?.ProgressToClick ?? 0
    );

export const mockTfInputAction = (input?: Partial<TouchFreeInputAction>) =>
    TouchFree.DispatchEvent('TransmitInputAction', createInputAction(input));

export const mockTfPluginPartialInputAction = (input?: Partial<TouchFreeInputAction>) =>
    InputActionManager.HandleInputAction(createInputAction(input));
    
export const mockTfPluginInputAction = (input: TouchFreeInputAction) =>
    InputActionManager.HandleInputAction(input);

export const checkTwoInputActionsAreSame = (a: TouchFreeInputAction | null, b: TouchFreeInputAction | null) => {
    if(!a && !b){
        return;
    } else if (!a || !b){
        fail("Only one input action was null");
    }

    Object.keys(a).forEach((key => {
        const castedKey = key as keyof TouchFreeInputAction;
        const valueA = a[castedKey];
        const valueB = b[castedKey];
        expect(valueA).toBe(valueB);
    }))
}

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

export const sleep = async (timeoutMS: number) => await new Promise(resolve => setTimeout(resolve, timeoutMS));
