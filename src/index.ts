/**
 * @packageDocumentation
 * TouchFree is an ecosystem of software products for enabling
 * touchless interfaces. This package is a client package
 * for integrating TouchFree into web application.
 * See https://docs.ultraleap.com/touchfree-user-manual/
 */

/** Functionality for changing configuration of the TouchFree Service */
import * as Configuration from './Configuration';

/** Functionality for managing a connection and messages sent to/from the TouchFree Service */
import * as Connection from './Connection';

/** Functionality to create different kinds of cursors */
import * as Cursors from './Cursors';

/** Functionality for implementing input controllers to respond to TouchFree inputs */
import * as InputControllers from './InputControllers';

/** Plugins which extend TouchFree's functionality */
import * as Plugins from './Plugins';
import TF from './TouchFree';
import * as Tracking from './Tracking';
import * as Utilities from './Utilities';

export {
    Configuration,
    Connection,
    Cursors,
    InputControllers,
    Plugins,
    /** Functionality for controlling the Ultraleap Tracking Service via TouchFree Service */
    Tracking,
    /** Utility functionality */
    Utilities,
};
export * from './TouchFreeToolingTypes';
export * from './TouchFree';
export default TF;
