import TouchFree from '../TouchFree';
import { TouchFreeInputAction, InputType } from '../TouchFreeToolingTypes';
import { mapRangeToRange } from '../Utilities';
import { TouchlessCursor } from './TouchlessCursor';

/**
 * {@link TouchlessCursor} which positions a dot on the screen at the hand location,
 * reacting to the current {@link TouchFreeInputAction.ProgressToClick}.
 *
 * @remarks
 * {@link TouchFreeInputAction.ProgressToClick} behaviour depends on the active interaction.
 *
 * @public
 */
export class DotCursor extends TouchlessCursor {
    /**
     * Update duration (in milliseconds) of the animation
     * @defaultValue 30fps (33.33ms)
     */
    readonly animationUpdateDuration: number = (1 / 30) * 1000;

    /**
     * The HTMLElement that visually represents the cursors ring.
     */
    cursorRing: HTMLElement;

    /**
     * The maximum size for the ring to be relative to the size of the dot.
     *
     * @remarks
     * e.g. a value of 2 means the ring can be (at largest) twice the scale of the dot.
     */
    ringSizeMultiplier: number;

    private cursorStartSize: Array<number>;
    private animationSpeed: Array<number> = [0, 0];

    private currentAnimationInterval = -1;

    private growQueued = false;

    private currentFadingInterval = -1;

    private dotCursorElement: HTMLElement;

    /**
     * Constructs a new cursor consisting of a central cursor and a ring.
     * @remarks
     * If you intend to make use of `WebInputController`, make sure both {@link _cursor} and {@link _cursorRing}
     * elements have the `touchfree-cursor` class. This prevents them from blocking other elements from
     * receiving events.
     * @param _cursor - Cursor HTML element
     * @param _cursorRing - Cursor ring HTML element
     * @param _animationDuration -
     * Optional duration changing the time it takes for 'squeeze'
     * confirmation animation to be performed.
     * @param _ringSizeMultiplier - Optional multiplier to the size the ring can be relative to the main cursor element.
     */
    constructor(cursor: HTMLElement, cursorRing: HTMLElement, animationDuration = 0.2, ringSizeMultiplier = 2) {
        super(cursor);
        this.dotCursorElement = cursor;
        this.cursorRing = cursorRing;
        this.ringSizeMultiplier = ringSizeMultiplier;
        this.cursorStartSize = this.getDimensions(this.dotCursorElement);

        this.animationSpeed[0] = this.cursorStartSize[0] / 2 / (animationDuration * 30);
        this.animationSpeed[1] = this.cursorStartSize[1] / 2 / (animationDuration * 30);

        TouchFree.registerEventCallback('handFound', this.showCursor.bind(this));
        TouchFree.registerEventCallback('handsLost', this.hideCursor.bind(this));
        TouchFree.registerEventCallback('handEntered', this.showCursor.bind(this));
        TouchFree.registerEventCallback('handExited', this.hideCursor.bind(this));
    }

    /**
     * Updates the cursor position as well as the size of the ring based on {@link TouchFreeInputAction.ProgressToClick}
     * @param inputAction - Input action to use when updating cursor
     * @see {@link TouchlessCursor.updateCursor}
     * @internal
     */
    protected override updateCursor(inputAction: TouchFreeInputAction): void {
        if (!this.enabled) return;
        //progressToClick is between 0 and 1. Click triggered at progressToClick = 1
        const ringScaler = mapRangeToRange(inputAction.ProgressToClick, 0, 1, this.ringSizeMultiplier, 1);

        this.cursorRing.style.opacity = inputAction.ProgressToClick.toString();

        const [cursorWidth, cursorHeight] = this.getDimensions(this.dotCursorElement);

        this.cursorRing.style.width = cursorWidth * ringScaler + 'px';
        this.cursorRing.style.height = cursorHeight * ringScaler + 'px';

        const [cursorRingWidth, cursorRingHeight] = this.getDimensions(this.cursorRing);

        this.cursorRing.style.left = inputAction.CursorPosition[0] - cursorRingWidth / 2 + 'px';
        this.cursorRing.style.top = inputAction.CursorPosition[1] - cursorRingHeight / 2 + 'px';

        super.updateCursor(inputAction);
    }

    /**
     * Replaces the basic functionality of {@link TouchlessCursor}
     *
     * @remarks
     * Makes the cursor ring scale dynamically with {@link TouchFreeInputAction.ProgressToClick};
     * creates a 'shrink' animation when a {@link InputType.DOWN} event is received;
     * creates a 'grow' animation when a {@link InputType.UP} event is received.
     *
     * When a {@link InputType.CANCEL} event is received the cursor is hidden as it suggests the hand
     * has been lost. When hidden and any other event is received, the cursor is shown again.
     * @param inputData - Input action to handle this update
     * @internal
     */
    protected override handleInputAction(inputData: TouchFreeInputAction): void {
        switch (inputData.InputType) {
            case InputType.MOVE:
                this.updateCursor(inputData);
                break;
            case InputType.DOWN:
                this.setCursorSize(0, 0, this.cursorRing);

                if (this.currentAnimationInterval !== -1) {
                    clearInterval(this.currentAnimationInterval);
                }

                this.currentAnimationInterval = setInterval(
                    this.shrinkCursor.bind(this) as TimerHandler,
                    this.animationUpdateDuration
                );
                break;
            case InputType.UP:
                if (this.currentAnimationInterval !== -1) {
                    this.growQueued = true;
                } else {
                    this.growQueued = false;
                    this.currentAnimationInterval = setInterval(
                        this.growCursor.bind(this) as TimerHandler,
                        this.animationUpdateDuration
                    );
                }
                break;

            case InputType.CANCEL:
                break;
        }
    }

    /**
     * Shrinks the cursor to half of its original size over the animation duration set in the `constructor`.
     * @internal
     */
    shrinkCursor(): void {
        if (!this.enabled) return;
        let [newWidth, newHeight] = this.getDimensions(this.dotCursorElement);

        if (newWidth > this.cursorStartSize[0] / 2) {
            newWidth -= this.animationSpeed[0];
        }

        if (newHeight > this.cursorStartSize[1] / 2) {
            newHeight -= this.animationSpeed[1];
        }

        this.setCursorSize(newWidth, newHeight, this.dotCursorElement);

        if (newWidth <= this.cursorStartSize[0] / 2 && newHeight <= this.cursorStartSize[1] / 2) {
            clearInterval(this.currentAnimationInterval);

            newWidth = this.cursorStartSize[0] / 2;
            newHeight = this.cursorStartSize[1] / 2;

            this.setCursorSize(newWidth, newHeight, this.dotCursorElement);

            if (this.growQueued) {
                this.growQueued = false;
                this.currentAnimationInterval = setInterval(
                    this.growCursor.bind(this) as TimerHandler,
                    this.animationUpdateDuration
                );
            } else {
                this.currentAnimationInterval = -1;
            }
        }
    }

    /**
     * Grows the cursor to its original size the animation duration set in the `constructor`.
     * @internal
     */
    growCursor(): void {
        if (!this.enabled) return;
        let [newWidth, newHeight] = this.getDimensions(this.dotCursorElement);

        if (newWidth < this.cursorStartSize[0]) {
            newWidth += this.animationSpeed[0];
        }

        if (newHeight < this.cursorStartSize[1]) {
            newHeight += this.animationSpeed[1];
        }

        this.setCursorSize(newWidth, newHeight, this.dotCursorElement);

        if (newWidth >= this.cursorStartSize[0] && newHeight >= this.cursorStartSize[1]) {
            clearInterval(this.currentAnimationInterval);

            this.setCursorSize(this.cursorStartSize[0], this.cursorStartSize[1], this.dotCursorElement);

            this.currentAnimationInterval = -1;
            this.growQueued = false;
        }
    }

    private setCursorSize(newWidth: number, newHeight: number, cursorToChange: HTMLElement): void {
        const [width, height] = this.getDimensions(cursorToChange);
        const deltaX = Math.round((width - newWidth) * 5) / 10;
        const deltaY = Math.round((height - newHeight) * 5) / 10;
        const cursorPosX = cursorToChange.offsetLeft + deltaX;
        const cursorPosY = cursorToChange.offsetTop + deltaY;

        cursorToChange.style.width = newWidth + 'px';
        cursorToChange.style.left = cursorPosX + 'px';

        cursorToChange.style.height = newHeight + 'px';
        cursorToChange.style.top = cursorPosY + 'px';
    }

    /**
     * Make the cursor visible. Fades over time.
     */
    override showCursor(): void {
        this.shouldShow = true;
        if (!this.enabled) return;
        clearInterval(this.currentFadingInterval);

        this.currentFadingInterval = setInterval(
            this.fadeCursorIn.bind(this) as TimerHandler,
            this.animationUpdateDuration
        );
    }

    /**
     * Make the cursor invisible. Fades over time.
     */
    override hideCursor(): void {
        this.shouldShow = false;
        if (parseFloat(this.dotCursorElement.style.opacity) !== 0) {
            clearInterval(this.currentFadingInterval);

            this.currentFadingInterval = setInterval(
                this.fadeCursorOut.bind(this) as TimerHandler,
                this.animationUpdateDuration
            );
        }
    }

    private fadeCursorIn(): void {
        let currentOpacity = parseFloat(this.dotCursorElement.style.opacity);
        currentOpacity = currentOpacity ? currentOpacity : 0;
        currentOpacity += 0.05;

        this.dotCursorElement.style.opacity = currentOpacity.toString();

        if (currentOpacity >= 1) {
            clearInterval(this.currentFadingInterval);
            this.dotCursorElement.style.opacity = '1.0';
            this.currentFadingInterval = -1;
        }
    }

    private fadeCursorOut(): void {
        let currentOpacity = parseFloat(this.dotCursorElement.style.opacity);
        currentOpacity = currentOpacity ? currentOpacity : 1;
        currentOpacity -= 0.05;

        this.dotCursorElement.style.opacity = currentOpacity.toString();

        if (parseFloat(this.cursorRing.style.opacity) > 0) {
            this.cursorRing.style.opacity = currentOpacity.toString();
        }

        if (currentOpacity <= 0) {
            clearInterval(this.currentFadingInterval);
            this.dotCursorElement.style.opacity = '0.0';
            this.currentFadingInterval = -1;
        }
    }
}
