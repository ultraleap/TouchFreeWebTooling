import { BaseInputController } from './BaseInputController';

/**
 * Global input controller initialized by {@link init}
 * @public
 */
let globalInputController: BaseInputController | undefined;

/** @public */
export const getInputController = () => globalInputController;

/** @internal */
export const setInputController = (inputController: BaseInputController) => (globalInputController = inputController);
