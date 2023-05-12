import { SwipeDirection } from '../Connection/TouchFreeServiceTypes';
import TouchFree from '../TouchFree';
import { InputType, TouchFreeInputAction } from '../TouchFreeToolingTypes';
import { MapRangeToRange } from '../Utilities';
import { TouchlessCursor } from './TouchlessCursor';

const MAX_SWIPE_NOTIFICATIONS = 1;
const TAIL_FADE_TIME_S = 1.5;
const TAIL_FADE_TIME_MS = TAIL_FADE_TIME_S * 1000;
const MIN_TAIL_LENGTH = 25;

export const enum CursorPart {
    CENTER_FILL,
    RING_FILL,
    CENTER_BORDER,
}

export class SVGCursor extends TouchlessCursor {
    private xPositionAttribute = 'cx';
    private yPositionAttribute = 'cy';
    private cursorCanvas: SVGSVGElement;
    private cursorRing: SVGCircleElement;
    private ringSizeMultiplier: number;

    private isDarkCursor = false;
    private cursorShowing = false;

    cursorTail: SVGPolygonElement;
    cursorPrompt: HTMLDivElement;
    cursorPromptWidth: number;
    hidingCursor = false;
    currentFadingInterval: NodeJS.Timeout | undefined = undefined;
    swipeNotificationTimeout: NodeJS.Timeout | undefined = undefined;
    totalSwipeNotifications = 0;
    swipeDirection?: SwipeDirection;
    previousPosition?: number[];
    previousTime?: number;
    tailLength = [0, 0];
    swipeTailTimeout?: NodeJS.Timeout;
    swipeTailInterval?: NodeJS.Timeout;
    drawNewTail = false;

    public allowCursorTail = false;
    public allowTextPrompt = true;

    // Group: Functions

    // Function: constructor
    // Constructs a new cursor consisting of a central cursor and a ring.
    // Optionally provide a ringSizeMultiplier to change the size that the <cursorRing> is relative to the _cursor.
    // Optionally provide a darkCursor to change the cursor to be dark to provide better contrast on light colored
    // UIs.
    constructor(ringSizeMultiplier = 2, darkCursor = false) {
        super(undefined);
        this.isDarkCursor = darkCursor;
        const documentBody = document.querySelector('body');

        const shadowColour = darkCursor ? '#ffffffB3' : '#000000B3';

        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.classList.add('touchfree-cursor');
        svgElement.style.opacity = '0';
        svgElement.style.position = 'absolute';
        svgElement.style.top = '0px';
        svgElement.style.left = '0px';
        svgElement.style.zIndex = '1000';
        svgElement.style.pointerEvents = 'none';
        svgElement.style.transition = 'opacity 0.5s linear';
        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', '100%');
        svgElement.setAttribute('shape-rendering', 'optimizeSpeed');
        svgElement.id = 'svg-cursor';
        svgElement.style.pointerEvents = 'none';
        documentBody?.appendChild(svgElement);

        const svgTailElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        svgTailElement.classList.add('touchfree-cursor');
        svgTailElement.setAttribute('opacity', '1');
        svgTailElement.setAttribute('points', '0,0 0,0 0,0');
        svgTailElement.style.fill = darkCursor ? 'black' : 'white';
        svgTailElement.style.filter = `drop-shadow(0 0 10px ${shadowColour})`;
        svgElement.appendChild(svgTailElement);
        this.cursorTail = svgTailElement;

        const svgRingElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        svgRingElement.classList.add('touchfree-cursor');
        svgRingElement.setAttribute('r', '15');
        svgRingElement.setAttribute('fill-opacity', '0');
        svgRingElement.setAttribute('stroke-width', '5');
        svgRingElement.setAttribute('stroke', darkCursor ? 'black' : 'white');
        svgRingElement.setAttribute(this.xPositionAttribute, '100');
        svgRingElement.setAttribute(this.yPositionAttribute, '100');
        svgRingElement.style.filter = `drop-shadow(0 0 10px ${shadowColour})`;
        svgElement.appendChild(svgRingElement);
        svgRingElement.id = 'svg-cursor-ring';
        this.cursorRing = svgRingElement;

        const cursorPromptDiv = document.createElement('div');
        this.cursorPromptWidth = 300;
        Object.assign(cursorPromptDiv.style, {
            width: `${this.cursorPromptWidth}px`,
            height: '40px',
            position: 'absolute',
            left: '0',
            top: '0',
            'background-color': 'black',
            'border-radius': '50px',
            border: '2px solid white',
            display: 'flex',
            opacity: 0,
            'pointer-events': 'none',
            color: 'white',
            'justify-content': 'center',
            'align-items': 'center',
            'font-size': '22px',
            'font-family': "'Trebuchet MS', sans-serif",
            transition: 'opacity 0.2s ease-out',
        });
        cursorPromptDiv.innerHTML = 'To Scroll: <strong>Swipe Faster</strong>';
        documentBody?.appendChild(cursorPromptDiv);
        this.cursorPrompt = cursorPromptDiv;

        const svgDotElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        svgDotElement.classList.add('touchfree-cursor');
        svgDotElement.setAttribute('r', '15');
        svgDotElement.setAttribute('fill', darkCursor ? 'black' : 'white');
        svgDotElement.setAttribute(this.xPositionAttribute, '100');
        svgDotElement.setAttribute(this.yPositionAttribute, '100');
        svgDotElement.setAttribute('opacity', '1');
        svgDotElement.style.transition = 'transform 200ms, opacity 666ms';
        svgDotElement.style.transformBox = 'fill-box';
        svgDotElement.style.transformOrigin = 'center';
        svgDotElement.style.transform = 'scale(1)';
        svgDotElement.style.filter = `drop-shadow(0 0 10px ${shadowColour})`;
        svgDotElement.id = 'svg-cursor-dot';
        svgElement.appendChild(svgDotElement);

        this.cursor = svgDotElement;
        this.cursorCanvas = svgElement;

        if (!darkCursor) {
            this.cursorCanvas.classList.add('touchfree-cursor--light');
            if (this.cursorRing) {
                this.cursorRing.style.filter = 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.7))';
            }
            svgDotElement.style.filter = 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.7))';
        }

        this.ResetToDefaultColors();
        this.ringSizeMultiplier = ringSizeMultiplier;

        TouchFree.RegisterEventCallback('HandFound', this.ShowCursor.bind(this));
        TouchFree.RegisterEventCallback('HandsLost', this.HideCursor.bind(this));
        TouchFree.RegisterEventCallback('HandEntered', this.ShowCursor.bind(this));
        TouchFree.RegisterEventCallback('HandExited', this.HideCursor.bind(this));
    }

    // Function: UpdateCursor
    // Used to update the cursor when receiving a "MOVE" <ClientInputAction>. Updates the
    // cursor's position, as well as the size of the ring based on the current ProgressToClick.
    protected UpdateCursor(inputAction: TouchFreeInputAction) {
        if (!this.shouldShow) {
            this.HideCursor();
            return;
        }
        const ringScaler = MapRangeToRange(inputAction.ProgressToClick, 0, 1, this.ringSizeMultiplier, 1);

        this.cursorRing.setAttribute('opacity', inputAction.ProgressToClick.toString());
        this.cursorRing.setAttribute('r', Math.round(this.GetCurrentCursorRadius() * ringScaler).toString());

        let position = inputAction.CursorPosition;
        const time = inputAction.Timestamp;
        let tailPoints: string;

        if (this.previousPosition && this.previousTime && this.swipeDirection != undefined) {
            if (this.drawNewTail) {
                this.tailLength = [0, 0];
                this.drawNewTail = false;
                this.cursorTail.setAttribute('opacity', '1');
            }

            let timeModifier = (time - this.previousTime) / 50000;
            timeModifier = timeModifier > 0 ? timeModifier : 1;

            const newTailLength = [
                Math.round(Math.abs(position[0] - this.previousPosition[0]) / timeModifier),
                Math.round(Math.abs(position[1] - this.previousPosition[1]) / timeModifier),
            ];

            if (
                (newTailLength[0] > this.tailLength[0] && newTailLength[0] > MIN_TAIL_LENGTH) ||
                (newTailLength[1] > this.tailLength[1] && newTailLength[1] > MIN_TAIL_LENGTH)
            ) {
                this.tailLength = newTailLength;

                clearTimeout(this.swipeTailTimeout);
                clearInterval(this.swipeTailInterval);

                this.swipeTailInterval = setInterval(() => {
                    const currentOpacity = this.cursorTail.getAttribute('opacity');
                    if (currentOpacity) {
                        let opacity = parseFloat(currentOpacity);
                        const modifier = 0.01 * (opacity + 0.5);
                        opacity -= modifier;
                        opacity = opacity || 0;
                        this.cursorTail.setAttribute('opacity', opacity.toString());
                    }
                }, TAIL_FADE_TIME_MS / 100);

                this.swipeTailTimeout = setTimeout(() => {
                    clearInterval(this.swipeTailInterval);
                    this.drawNewTail = true;
                }, TAIL_FADE_TIME_MS);
            }
        } else {
            this.tailLength = [0, 0];
        }

        switch (this.swipeDirection) {
            case SwipeDirection.LEFT:
                tailPoints = `${position[0]},${position[1] - 15} ${position[0]},${position[1] + 15} ${
                    position[0] + this.tailLength[0]
                },${position[1]}`;
                break;
            case SwipeDirection.RIGHT:
                tailPoints = `${position[0]},${position[1] - 15} ${position[0]},${position[1] + 15} ${
                    position[0] - this.tailLength[0]
                },${position[1]}`;
                break;
            case SwipeDirection.UP:
                tailPoints = `${position[0] - 15},${position[1]} ${position[0] + 15},${position[1]} ${position[0]},${
                    position[1] + this.tailLength[1]
                }`;
                break;
            case SwipeDirection.DOWN:
                tailPoints = `${position[0] - 15},${position[1]} ${position[0] + 15},${position[1]} ${position[0]},${
                    position[1] - this.tailLength[1]
                }`;
                break;
            default:
                // eslint-disable-next-line max-len
                tailPoints = `${position[0]},${position[1]} ${position[0]},${position[1]} ${position[0]},${position[1]}`;
        }

        if (position) {
            position = [Math.round(position[0]), Math.round(position[1])];
            if (!this.cursorShowing && this.enabled) {
                this.ShowCursor();
            }
            this.ShowCursor();
            this.cursorRing.setAttribute(this.xPositionAttribute, position[0].toString());
            this.cursorRing.setAttribute(this.yPositionAttribute, position[1].toString());

            if (this.allowCursorTail) {
                this.cursorTail.setAttribute('points', tailPoints);
            }

            this.cursorPrompt.style.left = `${position[0] - this.cursorPromptWidth / 2}px`;
            this.cursorPrompt.style.top = `${position[1] - 80}px`;

            if (this.cursor) {
                this.cursor.setAttribute(this.xPositionAttribute, position[0].toString());
                this.cursor.setAttribute(this.yPositionAttribute, position[1].toString());
            }
        } else {
            this.HideCursor();
        }

        this.previousPosition = position;
        this.previousTime = time;
    }

    // Function: HandleInputAction
    // This override replaces the basic functionality of the <TouchlessCursor>, making the
    // cursor's ring scale dynamically with the current ProgressToClick and creating a
    // "shrink" animation when a "DOWN" event is received, and a "grow" animation when an "UP"
    // is received.
    //
    // When a "CANCEL" event is received, the cursor is hidden as it suggests the hand has been lost.
    // When any other event is received and the cursor is hidden, the cursor is shown again.
    protected HandleInputAction(inputData: TouchFreeInputAction) {
        if (this.cursor) {
            switch (inputData.InputType) {
                case InputType.MOVE:
                    this.UpdateCursor(inputData);
                    break;
                case InputType.DOWN:
                    this.SetCursorSize(0, this.cursorRing);
                    this.cursor.style.transform = 'scale(0.5)';
                    break;
                case InputType.UP:
                    this.cursor.style.transform = 'scale(1)';
                    break;

                case InputType.CANCEL:
                    break;
            }
        }
    }

    private SetCursorSize(newWidth: number, cursorToChange: SVGElement) {
        cursorToChange?.setAttribute('r', Math.round(newWidth).toString());
    }

    // Function: ShowCursor
    // Used to make the cursor visible, fades over time
    ShowCursor() {
        this.shouldShow = true;
        if (this.enabled && !this.cursorShowing) {
            this.cursorShowing = true;
            this.SetCursorOpacity(this.opacityOnHandsLost);
        }
    }

    // Function: HideCursor
    // Used to make the cursor invisible, fades over time
    HideCursor() {
        if (this.shouldShow) {
            // If opacity is NaN or 0 then set it to be 1
            this.opacityOnHandsLost = Number(this.cursorCanvas.style.opacity) || 1;
        }
        this.shouldShow = false;
        this.cursorShowing = false;
        this.SetCursorOpacity(0);
        if (this.cursor) {
            this.cursor.style.transform = 'scale(1)';
        }
    }

    // Function: SetCursorOpacity
    // Used to set the opacity of the cursor
    SetCursorOpacity(opacity: number): void {
        this.cursorCanvas.style.opacity = opacity.toString();
    }

    private GetCurrentCursorRadius(): number {
        if (this.cursor) {
            const radius = this.cursor.getAttribute('r');
            if (!radius) {
                return 0;
            }

            const radiusAsNumber = parseFloat(radius);

            return radiusAsNumber;
        }
        return 0;
    }

    // Function: SetDefaultColors
    // Used to reset the SVGCursor to it's default styling
    ResetToDefaultColors() {
        this.cursor?.setAttribute('fill', this.isDarkCursor ? 'black' : 'white');
        this.cursor?.removeAttribute('stroke-width');
        this.cursor?.removeAttribute('stroke');
        this.cursorRing.setAttribute('stroke', this.isDarkCursor ? 'black' : 'white');
    }

    // Function: SetColor
    // Used to set a part of the SVGCursor to a specific color
    // Takes a CursorPart enum to select which part of the cursor to color and a color represented by a string
    SetColor(cursorPart: CursorPart, color: string) {
        switch (cursorPart) {
            case CursorPart.CENTER_FILL:
                this.cursor?.setAttribute('fill', color);
                return;
            case CursorPart.RING_FILL:
                this.cursorRing.setAttribute('stroke', color);
                return;
            case CursorPart.CENTER_BORDER:
                this.cursor?.setAttribute('stroke', color);
                this.cursor?.setAttribute('stroke-width', '2');
                return;
        }
    }

    ShowCloseToSwipe(): void {
        console.log('close to swipe');
        if (!this.allowTextPrompt) return;
        if (this.totalSwipeNotifications >= MAX_SWIPE_NOTIFICATIONS || this.swipeNotificationTimeout) {
            return;
        }

        this.cursorPrompt.style.opacity = '1';

        // this.totalSwipeNotifications++;

        this.swipeNotificationTimeout = setTimeout(() => {
            this.HideCloseToSwipe();
        }, 2000);
    }

    HandleHandsLost(): void {
        this.totalSwipeNotifications = 0;
        this.HideCursor();
        this.HideCloseToSwipe();
    }

    HideCloseToSwipe(): void {
        this.cursorPrompt.style.opacity = '0';
        clearTimeout(this.swipeNotificationTimeout);
        this.swipeNotificationTimeout = undefined;
    }

    SetSwipeDirection = (direction?: SwipeDirection) => {
        this.swipeDirection = direction;
        this.drawNewTail = true;
        this.tailLength = [0, 0];
    };
}

