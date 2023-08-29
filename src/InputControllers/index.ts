// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { init } from 'TouchFree';

import { BaseInputController } from './BaseInputController';

export { BaseInputController } from './BaseInputController';
export { WebInputController } from './WebInputController';

/**
 * Global input controller initialized by {@link init}
 * @public
 */
let globalInputController: BaseInputController | undefined;

/** @public */
export const getInputController = () => globalInputController;

/** @internal */
export const setInputController = (inputController: BaseInputController) => (globalInputController = inputController);
