/**
 * Handles dispatching `"transmitHandData"` events from received hand frame messages
 *
 * @internal
 */
export class HandDataManager extends EventTarget {
    /** Global static instance of the manager */
    private static internalInstance: HandDataManager;

    /** Global static for limiting how many frames are handled */
    private static readonly maximumFrameFrequencyMs = 50;

    /**
     * Getter for the global instance. Will initialize if not initialized already.
     */
    public static get instance() {
        if (HandDataManager.internalInstance === undefined) {
            HandDataManager.internalInstance = new HandDataManager();
        }

        return HandDataManager.internalInstance;
    }

    /** Global state for timestamp of last handled hand frame */
    static lastFrame: number | undefined = undefined;

    /**
     * Handles a buffer on hand frame data and dispatches a `"transmitHandData"` event
     * @param data - Buffer of hand frame data
     */
    public static handleHandFrame(data: ArrayBuffer): void {
        const currentTimeStamp = Date.now();
        if (
            !HandDataManager.lastFrame ||
            HandDataManager.lastFrame + HandDataManager.maximumFrameFrequencyMs < currentTimeStamp
        ) {
            const rawHandsEvent: CustomEvent<ArrayBuffer> = new CustomEvent<ArrayBuffer>('transmitHandData', {
                detail: data,
            });
            HandDataManager.instance.dispatchEvent(rawHandsEvent);
            HandDataManager.lastFrame = currentTimeStamp;
        }
    }
}
