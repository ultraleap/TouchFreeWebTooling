import { InputActionPlugin } from '../../../src/Plugins/InputActionPlugin';
import { TouchFreeInputAction } from '../../../src/TouchFreeToolingTypes';
import { SnappableElement } from './SnappableElement';
import { Vector2 } from './Vector2';

export enum SnapMode {
    MAGNET,
    CENTER,
}

export class SnappingPlugin extends InputActionPlugin {
    private snapDistance = 50;
    private snapMode = SnapMode.MAGNET;

    public static MAX_SOFTNESS = 1;
    public static MIN_SOFTNESS = 0;

    private snapSoftness = 0.3;

    override modifyInputAction(inputAction: TouchFreeInputAction): TouchFreeInputAction | null {
        const cursorPos: { x: number; y: number } = {
            x: inputAction.CursorPosition[0],
            y: inputAction.CursorPosition[1],
        };

        // Build a list of snappable elements and sort them by distance
        const elements = [...document.getElementsByClassName('snappable')]
            .map((value: Element) => SnappableElement.compute(value, Vector2.fromTuple(cursorPos)))
            .sort((a: SnappableElement, b: SnappableElement) => a.distance - b.distance);

        // Let's snap if there is snappable elements
        if (elements.length > 0) {
            if (elements[0].distance < this.snapDistance) {
                if (this.snapMode === SnapMode.CENTER) {
                    // If snapForce = 1, cursor position inside the shape is the same
                    // If snapForce = 0, cursor position is snapped in the middle
                    const snapForce: number = Number.parseFloat(
                        elements[0].element.getAttribute('data-snapforce') ?? this.snapSoftness.toString()
                    );

                    // From center of the shape to the border of the shape, following
                    // the direction between the center and the cursor
                    // From what we already have, vector = closest_center - closest_point
                    const centerToBorderVector: Vector2 = new Vector2(
                        elements[0].center.x - elements[0].closestPoint.x,
                        elements[0].center.y - elements[0].closestPoint.y
                    );

                    const distance: number = Math.sqrt(
                        Math.pow(centerToBorderVector.x, 2) + Math.pow(centerToBorderVector.y, 2)
                    );

                    // Intensity of the lerp between the edge and the center
                    let softSnapT: number =
                        (elements[0].centerDistance / distance) *
                        this.lerp(SnappingPlugin.MIN_SOFTNESS, SnappingPlugin.MAX_SOFTNESS, snapForce);

                    softSnapT = Math.max(Math.min(softSnapT, 1), 0);

                    const finalPos: { x: number; y: number } = {
                        x: this.lerp(elements[0].center.x, cursorPos.x, softSnapT),
                        y: this.lerp(elements[0].center.y, cursorPos.y, softSnapT),
                    };

                    inputAction.CursorPosition[0] = finalPos.x;
                    inputAction.CursorPosition[1] = finalPos.y;
                } else {
                    if (!elements[0].hovered) {
                        inputAction.CursorPosition[0] = elements[0].closestPoint.x;
                        inputAction.CursorPosition[1] = elements[0].closestPoint.y;
                    }
                }
            }
        }

        return inputAction;
    }

    private lerp(x: number, y: number, a: number): number {
        return x * (1 - a) + y * a;
    }

    public setSnapModeToMagnet() {
        this.snapMode = SnapMode.MAGNET;
    }

    public setSnapModeToCenter() {
        this.snapMode = SnapMode.CENTER;
    }

    public setSnapDistance(value: number) {
        this.snapDistance = value;
    }

    public setSnapSoftness(value: number) {
        this.snapSoftness = value;
    }
}
