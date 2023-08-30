import {
    Address,
    ConnectionManager,
    SVGCursor,
    WebInputController,
    setCurrentCursor,
    setInputController,
} from '../index';

/**
 * Extra options for initializing TouchFree
 * @public
 */
export interface TfInitParams {
    /**
     * If true or not provided a default {@link SVGCursor} will be created
     */
    initialiseCursor?: boolean;
    /**
     * Custom IP and port to connect to Service on. See {@link Address}
     */
    address?: Address;
}

/**
 * Initializes TouchFree - must be called before any functionality requiring a TouchFree service connection.
 *
 * @param tfInitParams - Optional extra initialization parameters
 * @public
 */
export function init(tfInitParams?: TfInitParams): void {
    ConnectionManager.init({ address: tfInitParams?.address });

    setInputController(new WebInputController());

    if (tfInitParams === undefined) {
        setCurrentCursor(new SVGCursor());
    } else {
        if (tfInitParams.initialiseCursor === undefined || tfInitParams.initialiseCursor === true) {
            setCurrentCursor(new SVGCursor());
        }
    }
}
