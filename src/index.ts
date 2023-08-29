/**
 * @packageDocumentation
 * TouchFree is an ecosystem of software products for enabling
 * touchless interfaces. This package is a client package
 * for integrating TouchFree into web application.
 * See https://docs.ultraleap.com/touchfree-user-manual/
 */

/** Record analytics data while running */
export * from 'Analytics';

/** Change configuration of the TouchFree Service */
export * from 'Configuration';

/** Manage a connection to the TouchFree service and messages send or receive messages */
export * from 'Connection';

/** Multiple cursor styles/implementations and current cursor management */
export * from 'Cursors';

/** Access to events occurring within TouchFree */
export * from 'Events';

/** Set up TouchFree tooling */
export * from 'Initialization';

/** Receive data about interactions */
export * from 'InputActions';

/** Input controllers consume TouchFree InputActions to provide new functionality */
export * from 'InputControllers';

/** Math types and functions */
export * from 'Math';

/** Control the Ultraleap Tracking Service via TouchFree Service */
export * from 'Tracking';
