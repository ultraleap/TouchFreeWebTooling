import { Ray } from './Ray';
import { Vector2 } from './Vector2';

export class SnappableElement {
    public element: Element;
    public distance: number;
    public closestPoint: Vector2;
    public center: Vector2;
    public centerDistance: number;
    public hovered: boolean;

    constructor(
        element: Element,
        distance: number,
        closestPoint: Vector2,
        center: Vector2,
        centerDistance: number,
        hovered: boolean
    ) {
        this.element = element;
        this.distance = distance;
        this.closestPoint = closestPoint;
        this.center = center;
        this.centerDistance = centerDistance;
        this.hovered = hovered;
    }

    public static compute(element: Element, distantPoint: Vector2): SnappableElement {
        const rect: DOMRect = element.getBoundingClientRect();
        const center: Vector2 = new Vector2(rect.x + rect.width / 2, rect.y + rect.height / 2);
        const centerDistance: number = Math.sqrt(
            Math.pow(distantPoint.x - center.x, 2) + Math.pow(distantPoint.y - center.y, 2)
        );

        const closestPoint: Vector2 = Ray.cast(distantPoint, center, element);
        let distance: number = Math.sqrt(
            Math.pow(distantPoint.x - closestPoint.x, 2) + Math.pow(distantPoint.y - closestPoint.y, 2)
        );

        const hovered: boolean = Ray.hit(distantPoint, element.getBoundingClientRect());
        if (hovered) {
            distance = -distance;
        }

        return new SnappableElement(element, distance, closestPoint, center, centerDistance, hovered);
    }
}
