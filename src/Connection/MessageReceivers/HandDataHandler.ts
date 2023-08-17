import { HandDataManager } from '../../Plugins/HandDataManager';

/**
 * Receives hand data messages from the service and distributes them
 *
 * @internal
 */
export class HandDataHandler {
    /**
     * How many times per second to check {@link latestHandDataItem}
     */
    private updateRate = 60;

    /**
     * Duration (in seconds) of update interval - inverse of {@link updateRate}
     */
    private updateDuration: number = (1 / this.updateRate) * 1000;

    constructor() {
        setInterval(this.CheckForHandData, this.updateDuration);
    }

    /**
     * The latest `HandFrame` that has been received from the Service.
     */
    latestHandDataItem?: ArrayBuffer = undefined;

    /**
     * Checks {@link latestHandDataItem} and if the `HandFrame` is not undefined sends it to
     * {@link HandDataManager} to handle the frame.
     */
    CheckForHandData = () => {
        const handFrame = this.latestHandDataItem;

        if (handFrame) {
            this.latestHandDataItem = undefined;
            // Wrapping the function in a timeout of 0 seconds allows the dispatch to be asynchronous
            setTimeout(() => {
                HandDataManager.HandleHandFrame(handFrame);
            });
        }
    };
}
