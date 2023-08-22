import { registerEventCallback } from '../TouchFree';
import { TouchFreeInputAction } from '../TouchFreeToolingTypes';

/**
 * Base class for creating touchless cursors.
 *
 * @remarks
 * Override {@link handleInputAction} to react to {@link TouchFreeInputAction}s
 * @public
 */
export abstract class TouchlessCursor {
    /**
     * The {@link HTMLElement} or {@link SVGElement} that represents this cursor
     */
    cursor: HTMLElement | SVGElement | undefined;

    /**
     * Whether the cursor should hide and show depending on hand presence
     */
    enabled: boolean;

    /**
     * Whether the cursor should be visible or not after being enabled
     */
    shouldShow: boolean;

    /**
     * The opacity of the cursor when hands are lost
     */
    protected opacityOnHandsLost = 1;

    /**
     * Registers the Cursor for updates via the `'transmitInputAction'` TouchFree event
     *
     * @remarks
     * If you intend to make use of `WebInputController`, make sure both {@link cursor} has
     * the `touchfree-cursor` class. This prevents them from blocking other elements from
     * receiving events.
     * @param cursor - Cursor element
     */
    constructor(cursor: HTMLElement | SVGElement | undefined) {
        registerEventCallback('transmitInputAction', this.handleInputAction.bind(this));

        this.cursor = cursor;
        this.enabled = true;
        this.shouldShow = true;
    }

    /**
     * Sets the position of the cursor, should be run after {@link handleInputAction}.
     * @param inputAction - Input action to use when updating cursor
     */
    protected updateCursor(inputAction: TouchFreeInputAction): void {
        if (this.cursor) {
            let width = this.cursor.clientWidth;
            let height = this.cursor.clientHeight;
            if (this.cursor instanceof HTMLElement) {
                [width, height] = this.getDimensions(this.cursor);
            }

            this.cursor.style.left = inputAction.CursorPosition[0] - width / 2 + 'px';
            this.cursor.style.top = inputAction.CursorPosition[1] - height / 2 + 'px';
        }
    }

    /**
     * Returns the height and width of the cursor in px
     * @param cursor - cursor to get height off
     * @returns [cursor width, cursor height]
     */
    protected getDimensions(cursor: HTMLElement): [number, number] {
        if (cursor.style.width && cursor.style.height) {
            const getFloat = (dimension: string) => parseFloat(dimension.replace('px', ''));
            return [getFloat(cursor.style.width), getFloat(cursor.style.height)];
        }

        const newCursor = cursor as HTMLImageElement;
        return [newCursor.width, newCursor.height];
    }

    /**
     * Invoked when new {@link TouchFreeInputAction}s are received.
     * Override to implement cursor behaviour.
     * @param inputAction - The latest input action received from TouchFree Service.
     */
    protected handleInputAction(inputAction: TouchFreeInputAction): void {
        this.updateCursor(inputAction);
    }

    /**
     * Make the cursor visible. Fades over time.
     */
    showCursor(): void {
        this.shouldShow = true;
        if (this.enabled) {
            this.setCursorOpacity(this.opacityOnHandsLost);
        }
    }

    /**
     * Make the cursor invisible. Fades over time.
     */
    hideCursor(): void {
        if (this.shouldShow) {
            // If opacity is NaN or 0 then set it to be 1
            this.opacityOnHandsLost = Number(this.cursor?.style.opacity) || 1;
        }
        this.shouldShow = false;
        this.setCursorOpacity(0);
    }

    /**
     * Used to enable the cursor so that it will show if hands are present
     */
    enableCursor(): void {
        this.enabled = true;
        if (this.shouldShow) {
            this.opacityOnHandsLost = 1;
            this.showCursor();
        }
    }

    /**
     * Used to disable the cursor so that it will never show
     */
    disableCursor(): void {
        this.enabled = false;
        const shouldShowOnEnable = this.shouldShow;
        if (shouldShowOnEnable) {
            this.hideCursor();
        }
        this.shouldShow = shouldShowOnEnable;
    }

    /**
     * Used to set the opacity of the cursor
     */
    setCursorOpacity(opacity: number): void {
        if (this.cursor) {
            this.cursor.style.opacity = opacity.toString();
        }
    }
}
