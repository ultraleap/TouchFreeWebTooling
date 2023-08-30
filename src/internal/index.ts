import { TouchlessCursor } from './Cursors/TouchlessCursor';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { init } from './Initialization/Initialization';
import { BaseInputController } from './InputControllers/BaseInputController';

/**
 * This index should include exports for everything in the library, including
 * internal types and functions. This single module can be consumed for access
 * to everything in the library.
 *
 * The whole library is in this internal folder to discourage direct usage of
 * modules via package import - using internals is an explicit decision. The
 * public API is controlled by the module in the directory above.
 */

export * from './Analytics/Analytics';

export * from './Configuration/ConfigurationApi';
export * from './Configuration/ConfigurationTypes';

export * from './Connection/ActionCode';
export * from './Connection/CallbackHandler';
export * from './Connection/ConnectionManager';
export * from './Connection/ConnectionTypes';
export * from './Connection/MessageReceivers/index';
export * from './Connection/RequestTypes';
export * from './Connection/ServiceConnection';
export * from './Connection/ServiceTypes';
export * from './Connection/WebsocketInputAction';

export * from './Cursors/DotCursor';
export * from './Cursors/SvgCursor';
export * from './Cursors/TouchlessCursor';

/**
 * Global cursor initialized by {@link init}
 * @public
 */
let currentCursor: TouchlessCursor | undefined;

/**
 * @returns The Cursor currently used by TouchFree
 * @public
 */
export const getCurrentCursor = () => currentCursor;

/**
 * Sets the cursor to be used by TouchFree
 * @param cursor - The cursor to be used. Can be `undefined` to unset.
 * @public
 */
export const setCurrentCursor = (cursor?: TouchlessCursor) => (currentCursor = cursor);

export * from './Hands/HandDataManager';
export * from './Hands/HandFrame';

export * from './Initialization/Initialization';

export * from './InputActions/InputAction';
export * from './InputActions/InputActionManager';
export * from './InputActions/InputActionPlugin';

export * from './InputControllers/BaseInputController';
export * from './InputControllers/WebInputController';

/**
 * Global input controller initialized by {@link init}
 * @public
 */
let globalInputController: BaseInputController | undefined;

/** @public */
export const getInputController = () => globalInputController;

/** @internal */
export const setInputController = (inputController: BaseInputController) => (globalInputController = inputController);

export * from './Math/Utilities';
export * from './Math/Vectors';

export * from './tests/testUtils';

export * from './TouchFreeEvents/TouchFreeEvents';

export * from './Tracking/TrackingApi';
export * from './Tracking/TrackingTypes';
