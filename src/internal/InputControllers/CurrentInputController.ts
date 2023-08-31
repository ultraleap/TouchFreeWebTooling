import { BaseInputController } from './BaseInputController';

/**
 * Global input controller initialized by {@link init}
 */
let globalInputController: BaseInputController | undefined;

/** @internal */
export const getInputController = () => globalInputController;

/** @internal */
export const setInputController = (inputController: BaseInputController) => (globalInputController = inputController);
