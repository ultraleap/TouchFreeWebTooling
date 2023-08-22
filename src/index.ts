/**
 * @packageDocumentation
 * TouchFree is an ecosystem of software products for enabling
 * touchless interfaces. This package is a client package
 * for integrating TouchFree into web application.
 * See https://docs.ultraleap.com/touchfree-user-manual/
 */

/** Functionality for changing configuration of the TouchFree Service */
export * from './Configuration';

/** Functionality for managing a connection and messages sent to/from the TouchFree Service */
export * from './Connection';

/** Functionality to create different kinds of cursors */
export * from './Cursors';

/** Functionality for implementing input controllers to respond to TouchFree inputs */
export * from './InputControllers';

/** Plugins which extend TouchFree's functionality */
export * from './Plugins';

/** Functionality for controlling the Ultraleap Tracking Service via TouchFree Service */
export * from './Tracking';

export * from './TouchFreeToolingTypes';
export * from './TouchFree';
