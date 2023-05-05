import TouchFree from '../TouchFree';
import { InputType, TouchFreeInputAction } from '../TouchFreeToolingTypes';
import { MapRangeToRange } from '../Utilities';
import { TouchlessCursor } from './TouchlessCursor';

export const enum CursorPart {
    CENTER_FILL,
    RING_FILL,
    CENTER_BORDER,
}

/**
 * {@link TouchlessCursor} created with SVG elements.
 * @public
 */
export class SVGCursor extends TouchlessCursor {
    private xPositionAttribute = 'cx';
    private yPositionAttribute = 'cy';
    private cursorCanvas: SVGSVGElement;
    private cursorRing: SVGCircleElement;
    private ringSizeMultiplier: number;

    private isDarkCursor = false;
    private cursorShowing = false;

    private baseRadius = 15;
    private baseDotBorderThickness = 2;
    private baseRingThickness = 5;
    private baseRingSizeMultiplier: number;

    /**
     * Constructs a new cursor consisting of a central cursor and a ring.
     * @param ringSizeMultiplier - Optional multiplier to change the size of the cursor ring.
     * @param darkCursor - Optionally darken the cursor to provide better contrast on light colored UIs.
     */
    constructor(ringSizeMultiplier = 2, darkCursor = false) {
        super(undefined);
        this.isDarkCursor = darkCursor;
        const documentBody = document.querySelector('body');

        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.classList.add('touchfree-cursor');
        svgElement.style.opacity = '0';
        svgElement.style.position = 'fixed';
        svgElement.style.top = '0px';
        svgElement.style.left = '0px';
        svgElement.style.zIndex = '1000';
        svgElement.style.pointerEvents = 'none';
        svgElement.style.transition = 'opacity 0.5s linear';
        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', '100%');
        svgElement.id = 'svg-cursor';
        documentBody?.appendChild(svgElement);

        const svgRingElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        svgRingElement.classList.add('touchfree-cursor');
        svgRingElement.setAttribute('r', this.baseRadius.toString());
        svgRingElement.setAttribute('fill-opacity', '0');
        svgRingElement.setAttribute('stroke-width', this.baseRingThickness.toString());
        svgRingElement.setAttribute(this.xPositionAttribute, '100');
        svgRingElement.setAttribute(this.yPositionAttribute, '100');
        svgRingElement.style.filter = 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))';
        svgElement.appendChild(svgRingElement);
        svgRingElement.id = 'svg-cursor-ring';
        this.cursorRing = svgRingElement;

        const svgDotElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        svgDotElement.classList.add('touchfree-cursor');
        svgDotElement.setAttribute('r', this.baseRadius.toString());
        svgDotElement.setAttribute(this.xPositionAttribute, '100');
        svgDotElement.setAttribute(this.yPositionAttribute, '100');
        svgDotElement.setAttribute('opacity', '1');
        svgDotElement.setAttribute('stroke-width', this.baseDotBorderThickness.toString());
        svgDotElement.style.transformBox = 'fill-box';
        svgDotElement.style.transformOrigin = 'center';
        svgDotElement.style.transform = 'scale(1)';
        svgDotElement.style.filter = 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))';
        svgDotElement.id = 'svg-cursor-dot';
        svgElement.appendChild(svgDotElement);

        if (!darkCursor) {
            if (this.cursorRing) {
                this.cursorRing.style.filter = 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.7))';
            }
            svgDotElement.style.filter = 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.7))';
        }

        this.cursor = svgDotElement;

        this.cursorCanvas = svgElement;

        this.ResetToDefaultColors();

        this.ringSizeMultiplier = ringSizeMultiplier;
        this.baseRingSizeMultiplier = ringSizeMultiplier;

        TouchFree.RegisterEventCallback('HandFound', this.ShowCursor.bind(this));
        TouchFree.RegisterEventCallback('HandsLost', this.HideCursor.bind(this));
        TouchFree.RegisterEventCallback('HandEntered', this.ShowCursor.bind(this));
        TouchFree.RegisterEventCallback('HandExited', this.HideCursor.bind(this));
    }

    /**
     * Update the cursor position as well as the size of the ring based on {@link TouchFreeInputAction.ProgressToClick}.
     * @param inputAction - Input action to use when updating cursor
     * @internal
     */
    protected override UpdateCursor(inputAction: TouchFreeInputAction) {
        if (!this.shouldShow) {
            this.HideCursor();
            return;
        }
        const ringScaler = MapRangeToRange(inputAction.ProgressToClick, 0, 1, this.ringSizeMultiplier, 1);

        this.cursorRing.setAttribute('opacity', inputAction.ProgressToClick.toString());
        const radius = Math.round(this.GetCurrentCursorRadius() * ringScaler + this.GetCurrentCursorRingWidth() / 2);
        this.cursorRing.setAttribute('r', radius.toString());

        let position = inputAction.CursorPosition;

        if (position) {
            position = [Math.round(position[0]), Math.round(position[1])];
            if (!this.cursorShowing && this.enabled) {
                this.ShowCursor();
            }
            this.cursorRing.setAttribute(this.xPositionAttribute, position[0].toString());
            this.cursorRing.setAttribute(this.yPositionAttribute, position[1].toString());

            if (this.cursor) {
                this.cursor.setAttribute(this.xPositionAttribute, position[0].toString());
                this.cursor.setAttribute(this.yPositionAttribute, position[1].toString());
            }
        } else {
            this.HideCursor();
        }
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
    protected override HandleInputAction(inputData: TouchFreeInputAction) {
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

    // Function: SetCursorScale
    // Used to set the scale of the cursor
    SetCursorScale(scale: number) {
        const cursor = this.cursor as SVGElement;
        this.SetCursorSize(this.baseRadius * scale, cursor);
        this.ringSizeMultiplier = this.baseRingSizeMultiplier + (scale - 1);
        cursor.setAttribute('stroke-width', Math.round(this.baseDotBorderThickness * scale).toString());
    }

    // Function: SetRingThicknessScale
    // Used to set the scale of the cursor's ring thickness
    SetRingThicknessScale(scale: number) {
        this.cursorRing.setAttribute('stroke-width', Math.round(this.baseRingThickness * scale).toString());
    }

    /**
     * Make the cursor visible. Fades over time.
     */
    override ShowCursor() {
        this.shouldShow = true;
        if (this.enabled && !this.cursorShowing) {
            this.cursorShowing = true;
            this.SetCursorOpacity(this.opacityOnHandsLost);
        }
    }

    /**
     * Make the cursor invisible. Fades over time.
     */
    override HideCursor() {
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

    /**
     * Used to set the opacity of the cursor
     */
    override SetCursorOpacity(opacity: number): void {
        this.cursorCanvas.style.opacity = opacity.toString();
    }

    // Function: SetCursorOptimise
    // Used to set the rendering mode of the SVGCursor to be optimised for speed or rendered in the default manner
    SetCursorOptimise(optimise: boolean) {
        this.cursorCanvas.setAttribute('shape-rendering', optimise ? 'optimizeSpeed' : 'auto');
    }

    // Function: GetCurrentCursorRadius
    // Used to set the radius of the cursor
    private GetCurrentCursorRadius(): number {
        const radius = this.cursor?.getAttribute('r');
        return !radius ? 0 : parseFloat(radius);
    }

    // Function: GetCurrentCursorRingWidth
    // Used to set the width of the cursor ring
    private GetCurrentCursorRingWidth(): number {
        const width = this.cursorRing.getAttribute('stroke-width');
        return !width ? 0 : parseFloat(width);
    }

    /**
     * Used to reset the SVGCursor to it's default styling
     */
    ResetToDefaultColors() {
        this.cursor?.setAttribute('fill', this.isDarkCursor ? 'black' : 'white');
        this.cursor?.removeAttribute('stroke');
        this.cursorRing.setAttribute('stroke', this.isDarkCursor ? 'black' : 'white');
    }

    // Function: ResetToDefaultScale
    // Used to reset the SVGCursor to it's default scale
    ResetToDefaultScale() {
        const cursor = this.cursor as SVGElement;
        this.SetCursorSize(this.baseRadius, cursor);
        this.ringSizeMultiplier = this.baseRingSizeMultiplier;
        cursor.setAttribute('stroke-width', this.baseDotBorderThickness.toString());
        this.cursorRing.setAttribute('stroke-width', this.baseRingThickness.toString());
    }

    /**
     * Used to set a part of the SVGCursor to a specific color
     * @param cursorPart - enum to select which part of the cursor to color
     * @param color - color represented by a string
     */
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
                return;
        }
    }
}
