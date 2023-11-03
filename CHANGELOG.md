# TouchFree Web Tooling Changelog

![Discord](https://img.shields.io/discord/994213697490800670?label=Ultraleap%20Developer%20Community&logo=discord)
[![documentation](https://img.shields.io/badge/Documentation-docs.ultraleap.com-00cf75)](https://docs.ultraleap.com/touchfree-user-manual/)
[![mail](https://img.shields.io/badge/Contact-support%40ultraleap.com-00cf75)](mailto:support@ultraleap.com)

All notable changes to the TouchFree Web Tooling project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `SVGCursor` can now be scaled to increase or decreased the size of the cursor.
- New `resetInteractionConfigFileToDefault` function to reset the interaction settings.
- `SVGCursor.setCursorOptimise(bool)` allows control over whether the SVG cursor is rendered optimised for speed or not.
- New Analytics API supporting logging both TouchFree interaction events and non-TouchFree events:
  - `startAnalyticsSession` and `stopAnalyticsSession` functions to start and stop an analytics session in the Service.
  - `registerAnalyticEvents`, `unregisterAnalyticEvents` and `getRegisteredAnalyticEventKeys` functions to register / unregister / view registered non-TouchFree analytic events (e.g. `pointerdown` or `touchstart`).
  - `isAnalyticsActive` that allows users to determine if there is an active session.
- Generated markdown files detailing the public API.
- An api report detailing the public API is now generated in `api/touchfree.api.md`.
- `DeepPartial` type was added to support situations where all properties (nested included) of a type should be optional.
- `TouchFreeServiceState` type to distinguish situations where no information is available when disconnected and full `ServiceState` information is available.
- `onServiceStatusChange` event will now be sent with 'Disconnected' state when the TouchFree Service disconnects when it was previously connected.

### Changed

- All documentation comments changed to [TSDoc](https://tsdoc.org/) format.
- Exports have been flattened into a single top level module without nested namespaces for the public API of the library and a single `internal` module below that includes all exported content for modules in the library.
  - In the javascript bundle internal content is exported in the `internal` namespace.
  - Content only exported via the `internal` module is not subject to semantic versioning and changes to only internal content will not be present in this changelog.
  - The public API can be viewed in top level module `index` or in the generated api report `api/touchfree.api.md` on the [GitHub repo](https://github.com/ultraleap/TouchFreeWebTooling).
- Updated syntax throughout the library to follow [Google's TS styleguide](https://google.github.io/styleguide/tsguide.html). Many symbols names have changed as a result of this.
- Bundle package name changed from `TouchFree` to `touchfree` to match NPM package name.
- `ConfigurationManager` and `ConnectionManager` are no longer classes - they have been changed to modules with functions and types exported at the top level.
  - `ConnectionApi` changes includes:
    - `connect(Address?)` and `disconnect` to connect to connect and disconnect from the service (optionally at a different address than default).
    - `isConnected` and `getCurrentServiceAddress` functions added to query the TouchFree service connection status and current address. `getDefaultServiceAddress` added to retrieve the default address.
    - `setAddress` was removed as it's functionally equivalent to connect with the optional Address parameter.
    - `init` was removed and internal state previously within the `ConnectionManager` was moved to the internal class `ServiceConnection`.
    - `handleHandPresenceEvent` and `handleInteractionZoneEvent` were moved to internal class `ServiceConnection`.
  - `ConfigurationApi` has not changed significantly.
- Several data types that were previously declared as classes are now interfaces. These changes should not be functionally impactful unless constructor for these types were are called in consuming code.
- Several now-internal types used for events have been replaced with new types for use in the public API - these changes impact several events subscribed to via `registerEventCallback` and request functions:
  - `WebSocketResponse` -> `ResponseState`: General purpose response type.
  - `WebSocketCallback` -> `ResponseCallback`: General purpose responses callback type for requests from the service.
  - `ConfigState` -> `TouchFreeConfig`: returned by `requestConfigChange`, `requestConfigFileChange` and `resetInteractionConfigFileToDefault`.
  - `ServiceStatus` -> `ServiceState`: returned by `requestServiceStatus`.
- `dispatchEvent` renamed to `dispatchEventCallback` to avoid conflict with `dispatchEvent` in base libraries.
- `EventHandle` renamed to `TouchFreeEventHandle`.

### Fixed

- All exports within the library are now relative to resolve common issues when processing source with other tools e.g. compilers/bundlers.
- Circular dependencies between modules within the library have been (mostly) eliminated.
- Fixed an issue where pending callbacks could be removed before being given any chance to be processed due to issue with expiration logic.

### Removed

- Top level `TouchFree` module was removed. `init` and `TfInitParams` has moved to the `Initialization` module and are exported in the top level module. Other functionality has been redistributed to `Cursors`, `TouchFreeEvents`, `CurrentInputController` and `ConnectionApi` modules.
- Previously deprecated or internal unused functionality has been removed.
- `InteractionConfigFull` has been removed - the base `InteractionConfig` no longer has partial fields.
  - `DeepPartial` is used in situations where fields of the configuration should be optional.

## [1.4.0] - 2023-04-06

### Added

- `TouchFree.SetCurrentCursor` allows you to set the current cursor of TouchFree. For use when `initialiseCursor` is set to `false`.
- `ServiceStatus` now includes the service version, tracking version, camera serial number and camera firmware version.
- `OnServiceStatusChange` event - provides data about the status of the TouchFree Service whenever it changes.
- `WhenConnected` event - functions identically to `OnConnected` but will dispatch an event immediately if already connected to the TouchFree Service.
- `IsConnected` function exported as part of the top level `TouchFree` object for querying whether or not the client is connected to the TouchFree Service.
- `HandEntered` event disptached when the active hand enters the interaction zone (if enabled).
- `HandExited` event disptached when the active hand exits the interaction zone (if enabled).
- Ability to set the IP and port that tooling should connect to the service via.
- `SVGCursor.SetColor` allows you to set the color of the SVGCursor center fill, ring fill or center border.
- `SVGCursor.ResetToDefaultColors` allows you reset the color of the entire SVGCursor back to it's default colors.
- Cancelled drags (i.e. due to hands lost) now send pointerOut and pointerCancel events to element where the drag started

### Changed

- Improved error and warning messaging when TouchFree Tooling and Service API versions do not match.

### Deprecated

- `ConnectionManager.AddConnectionListener()` - functions identically to the `WhenConnected` event added this release and has been deprecated in favor of it.
- `ConnectionManager.AddServiceStatusListener()` - functions identically to the `OnTrackingServiceStateChange` event and has been deprecated in favor of it.

### Fixed

- Improved reliability of Scrolling with the WebInput Controller
- Improved reliability of `touchfree-no-scroll` making elements unscrollable (with TouchFree Tooling)
- Improved reliability of button hover states when a hand is first detected

## [1.3.0] - 2022-11-23

### Added

- Top level `TouchFree` object as a place for functionality to accomplish common TouchFree tasks.
- `Init` function in the `TouchFree` object which simplifies initialization of TouchFree to a single call.
- Event handling functions in `TouchFree` object:
  - `RegisterEvent` for registering callbacks to global TouchFree events safely. Returns a convenient object that can be used to `UnregisterEventCallback`.
  - `DispatchEvent` for dispatching events safely - not typically needed by library consumers.

### Changed

- TouchFree will now send Click events.

## [1.2.0] - 2022-09-30

### Added

- New cursor that uses SVGs rather than images - allowing for integration into a page using a single line of code.
- The Ultraleap Tracking Service can now be configured through the Tooling for Web.

### Changed

- The TouchFree cursor will now scroll scrollable areas without the need for extra code in the InputController.

## [1.1.1] - 2022-06-14

### Added

- `ServiceConnection.Disconnect` allowing a user to force close the web socket.

### Fixed

- Several internal fixes to ensure stability.

## [1.1.0] - 2022-06-8

### Added

- Input Action Events can now be sent to HTML elements at the position of the cursor, making it easier to build reactive content.
- TouchFree tooling clients can request updates to the config files via the service to make global changes to the TouchFree configuration for all clients.
- TouchFree service state can be queried.

### Fixed

- NONE events are now properly culled from overfilled InputAction Queues, improving performance.
- Web Tooling cursor position now aligns correctly with scaled displays.
- Cursor position no longer needs to be inverted in the Y axis every time it's used.
  - NOTE: If you have used TouchFree cursor data directly, you will need to update your code to remove the inversion of the Y Axis data

## [1.0.0] - 2021-09-7

Initial release
