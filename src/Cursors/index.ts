// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { init } from 'TouchFree';

import { TouchlessCursor } from './TouchlessCursor';

export * from './DotCursor';
export * from './SvgCursor';
export * from './TouchlessCursor';

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
