import { HandDataManager } from '../../Plugins/HandDataManager';

export class HandDataHandler {
    // Variable: update Rate
    updateRate = 60;

    // Calculated on construction for use in setting the update interval
    private updateDuration: number = (1 / this.updateRate) * 1000;

    constructor() {
        setInterval(this.CheckForHandData, this.updateDuration);
    }

    // Variable: latestHandDataItem
    // The latest <HandFrame> that has been received from the Service.
    latestHandDataItem?: ArrayBuffer = undefined;

    // Function: CheckForHandData
    // Checks <latestHandDataItem> and if the <HandFrame> is not undefined sends it to
    // <HandDataManager> to handle the frame.
    CheckForHandData(): void {
        const handFrame = this.latestHandDataItem;

        if (handFrame) {
            this.latestHandDataItem = undefined;
            // Wrapping the function in a timeout of 0 seconds allows the dispatch to be asynchronous
            setTimeout(() => {
                HandDataManager.HandleHandFrame(handFrame);
            });
        }
    }
}
