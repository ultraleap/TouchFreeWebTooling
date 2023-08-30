import { InputType, TouchFreeInputAction } from '../InputActions/InputAction';
import { dispatchEventCallback } from '../TouchFreeEvents/TouchFreeEvents';
import { BaseInputController } from './BaseInputController';

/**
 * Provides web PointerEvents from incoming {@link TouchFreeInputAction}s.
 *
 * @remarks
 * If you are using cursors with this InputController, ensure they have the "touchfree-cursor"
 * class. This allows this class to ignore them when determining which elements should receive
 * new pointer events. If you don't do this, none of the events transmitted here are guaranteed
 * to make it to their intended targets, as they will be captured by the cursor.
 * @public
 */
export class WebInputController extends BaseInputController {
    /**
     * Can be used to enable/disable the transmission of "pointerenter"/"pointerleave" events
     * Disable this for a minor performance boost, at the cost of no longer sending those events
     * to the UI.
     */
    enterLeaveEnabled = true;

    private lastHoveredElement: Element | null = null;
    private readonly pointerId: number = 0;
    private readonly baseEventProps: PointerEventInit;
    private readonly activeEventProps: PointerEventInit;
    private elementsOnDown: HTMLElement[] | null = null;
    private scrollElementsOnDown: HTMLElement[] | null = null;
    private lastPosition: Array<number> | null = null;
    private scrollDirection: ScrollDirection | undefined = undefined;
    private elementToScroll: HTMLElement | undefined = undefined;

    /**
     *  Any element with this class name in its css class list will be ignored when trying to find
     * the correct element for the WebInputController to scroll
     */
    private readonly NO_SCROLL_CLASS_NAME: string = 'touchfree-no-scroll';

    /**
     * Sets up the basic event properties for all events transmitted from this InputController.
     */
    constructor() {
        super();

        this.baseEventProps = {
            pointerId: this.pointerId,
            bubbles: true,
            isPrimary: true,
            width: 10,
            height: 10,
            clientX: 0,
            clientY: 0,
            pointerType: 'pen',
        };

        this.activeEventProps = this.baseEventProps;
    }

    /**
     * Handles the transmission of "pointerout"/"pointerover"/"pointermove" events to appropriate
     * elements, based on the {@link element} being hovered over this frame, and the element
     * hovered last frame.
     * Will also optionally send "pointerenter"/"pointerleave" events if enabled via
     * {@link enterLeaveEnabled}
     * @param element - The DOM element under the cursor this frame
     * @internal
     */
    handleMove(element: Element | null): void {
        if (element !== this.lastHoveredElement) {
            // Handle sending pointerover/pointerout to the individual elements
            // These events bubble, so we only have to dispatch them to the element directly under
            // the cursor
            if (this.lastHoveredElement !== null) {
                const outEvent = new PointerEvent('pointerout', this.activeEventProps);
                this.lastHoveredElement.dispatchEvent(outEvent);
            }

            if (element !== null) {
                const overEvent = new PointerEvent('pointerover', this.activeEventProps);
                element.dispatchEvent(overEvent);
            }

            if (this.enterLeaveEnabled) {
                this.handleEnterLeaveBehaviour(element);
            }
        }

        const moveEvent = new PointerEvent('pointermove', this.activeEventProps);
        element?.dispatchEvent(moveEvent);

        this.lastHoveredElement = element;
    }

    /**
     * Emits Pointer events (e.g. pointermove/pointerdown) to the objects at a {@link TouchFreeInputAction}s location.
     *
     * @remarks
     * Which events are emitted is affected by {@link enterLeaveEnabled}.
     *
     * Sends the following events by default:
     *
     *     - pointermove
     *     - pointerdown
     *     - pointerup
     *     - pointerover
     *     - pointerout
     *     - pointerenter
     *     - pointerleave
     * @param inputData - The latest {@link TouchFreeInputAction} from the Service
     * @internal
     */
    protected override handleInputAction(inputData: TouchFreeInputAction): void {
        super.handleInputAction(inputData);

        const elementsAtPoint = document.elementsFromPoint(inputData.CursorPosition[0], inputData.CursorPosition[1]);
        const elementAtPos = this.getTopNonCursorElement(elementsAtPoint);

        this.activeEventProps.clientX = inputData.CursorPosition[0];
        this.activeEventProps.clientY = inputData.CursorPosition[1];

        if (elementAtPos !== null) {
            dispatchEventCallback('inputAction', inputData);
        }

        switch (inputData.InputType) {
            case InputType.CANCEL: {
                this.resetScrollData();
                const cancelEvent = new PointerEvent('pointercancel', this.activeEventProps);
                const outEvent = new PointerEvent('pointerout', this.activeEventProps);

                if (this.lastHoveredElement !== null) {
                    this.lastHoveredElement.dispatchEvent(cancelEvent);
                    this.lastHoveredElement.dispatchEvent(outEvent);

                    this.lastHoveredElement = null;
                }

                const elementOnDown = this.getTopNonCursorElement(this.elementsOnDown);
                if (elementOnDown) {
                    elementOnDown.dispatchEvent(cancelEvent);
                    elementOnDown.dispatchEvent(outEvent);
                }

                if (elementAtPos !== null) {
                    const parentTree = this.getOrderedParents(elementAtPos);

                    parentTree.forEach((parent: Node | null) => {
                        if (parent !== null) {
                            parent.dispatchEvent(cancelEvent);
                            parent.dispatchEvent(outEvent);
                        }
                    });
                }
                break;
            }

            case InputType.MOVE:
                this.handleMove(elementAtPos);

                this.handleScroll(inputData.CursorPosition);
                break;

            case InputType.DOWN: {
                this.resetScrollData();
                this.elementsOnDown = this.clickableElementsAtPosition(elementsAtPoint);
                this.scrollElementsOnDown = this.elementsOnDown.filter(
                    (e) => !e.classList.contains(this.NO_SCROLL_CLASS_NAME)
                );

                this.lastPosition = inputData.CursorPosition;

                const downEvent = new PointerEvent('pointerdown', this.activeEventProps);
                this.dispatchToTarget(downEvent, elementAtPos);
                break;
            }

            case InputType.UP: {
                const elementsOnUp = this.clickableElementsAtPosition(elementsAtPoint);

                if (elementsOnUp?.length && this.elementsOnDown?.length) {
                    for (const element of elementsOnUp) {
                        const matchingElement = this.elementsOnDown.find((eod) => eod == element);
                        if (matchingElement) {
                            matchingElement.click();
                            break;
                        }
                    }
                }

                this.resetScrollData();

                const upEvent = new PointerEvent('pointerup', this.activeEventProps);
                this.dispatchToTarget(upEvent, elementAtPos);
                break;
            }
        }
    }

    private clickableElementsAtPosition(elements: Element[] | null): HTMLElement[] {
        return (elements ?? [])
            .map((e) => e as HTMLElement)
            .filter((e) => e && !e.classList.contains('touchfreecursor') && !e.classList.contains('touchfree-cursor'));
    }

    /** Clears information about the current scroll */
    private resetScrollData(): void {
        this.scrollElementsOnDown = null;
        this.scrollDirection = undefined;
        this.elementToScroll = undefined;
    }

    /** Applies scrolling to any elements that should be scrolled */
    private handleScroll(position: Array<number>): void {
        if (this.scrollElementsOnDown && this.lastPosition) {
            const changeInPositionX = this.lastPosition[0] - position[0];
            const changeInPositionY = this.lastPosition[1] - position[1];

            if (!this.scrollDirection && (Math.abs(changeInPositionX) > 5 || Math.abs(changeInPositionY) > 5)) {
                if (Math.abs(changeInPositionX) > Math.abs(changeInPositionY)) {
                    this.scrollDirection = changeInPositionX > 0 ? ScrollDirection.RIGHT : ScrollDirection.LEFT;
                } else {
                    this.scrollDirection = changeInPositionY > 0 ? ScrollDirection.DOWN : ScrollDirection.UP;
                }
            }

            this.lastPosition = position;

            if (
                changeInPositionY > 0 &&
                (this.scrollDirection === undefined || this.scrollDirection === ScrollDirection.DOWN)
            ) {
                const element = this.getElementToScroll(
                    (e: HTMLElement) =>
                        e.scrollHeight > e.clientHeight && e.scrollTop + e.clientHeight < e.scrollHeight - 1,
                    (e: HTMLElement, p: HTMLElement) =>
                        e.offsetHeight === p.offsetHeight && e.scrollHeight === p.scrollHeight
                );

                if (element) {
                    this.elementToScroll = element;
                    element.scrollTop = Math.min(
                        element.scrollHeight - element.clientHeight,
                        element.scrollTop + changeInPositionY
                    );
                }
            }

            if (
                changeInPositionY < 0 &&
                (this.scrollDirection === undefined || this.scrollDirection === ScrollDirection.UP)
            ) {
                const element = this.getElementToScroll(
                    (e: HTMLElement) => e.scrollHeight > e.clientHeight && e.scrollTop > 0,
                    (e: HTMLElement, p: HTMLElement) =>
                        e.offsetHeight === p.offsetHeight && e.scrollHeight === p.scrollHeight
                );

                if (element) {
                    this.elementToScroll = element;
                    element.scrollTop = Math.max(0, element.scrollTop + changeInPositionY);
                }
            }

            if (
                changeInPositionX > 0 &&
                (this.scrollDirection === undefined || this.scrollDirection === ScrollDirection.RIGHT)
            ) {
                const element = this.getElementToScroll(
                    (e: HTMLElement) => e.scrollWidth > e.clientWidth && e.scrollLeft + e.clientWidth < e.scrollWidth,
                    (e: HTMLElement, p: HTMLElement) =>
                        e.offsetWidth === p.offsetWidth && e.scrollWidth === p.scrollWidth
                );

                if (element) {
                    this.elementToScroll = element;
                    element.scrollLeft = Math.min(
                        element.scrollWidth - element.clientWidth,
                        element.scrollLeft + changeInPositionX
                    );
                }
            }

            if (
                changeInPositionX < 0 &&
                (this.scrollDirection === undefined || this.scrollDirection === ScrollDirection.LEFT)
            ) {
                const element = this.getElementToScroll(
                    (e: HTMLElement) => e.scrollWidth > e.clientWidth && e.scrollLeft > 0,
                    (e: HTMLElement, p: HTMLElement) =>
                        e.offsetWidth === p.offsetWidth && e.scrollWidth === p.scrollWidth
                );

                if (element) {
                    this.elementToScroll = element;
                    element.scrollLeft = Math.max(0, element.scrollLeft + changeInPositionX);
                }
            }
        }
    }

    /**
     * Gets the element that should have scrolling applied to it
     *
     * @remarks
     * Any elements with the {@link noScrollClassName} class applied will be ignored when
     * finding which element to scroll
     */
    private getElementToScroll = (
        scrollValidation: (element: HTMLElement) => boolean,
        parentScrollValidation: (element: HTMLElement, parentElement: HTMLElement) => boolean
    ): HTMLElement | undefined => {
        if (this.elementToScroll) return this.elementToScroll;
        if (!this.scrollElementsOnDown) return;

        for (let i = 0; i < this.scrollElementsOnDown.length; i++) {
            let elementToCheckScroll = this.scrollElementsOnDown[i];
            if (!scrollValidation(elementToCheckScroll)) continue;

            let parentSelected = false;
            let parentAsHtmlElement = elementToCheckScroll.parentElement as HTMLElement;
            while (parentAsHtmlElement) {
                const parentIsNoScroll = parentAsHtmlElement.classList.contains(this.NO_SCROLL_CLASS_NAME);
                const elementIsNoScroll = elementToCheckScroll.classList.contains(this.NO_SCROLL_CLASS_NAME);
                const parentScrollValid = parentScrollValidation(elementToCheckScroll, parentAsHtmlElement);

                if (!parentIsNoScroll && !elementIsNoScroll && !parentScrollValid) {
                    break;
                }

                if (parentIsNoScroll) {
                    parentAsHtmlElement = parentAsHtmlElement.parentElement as HTMLElement;
                } else {
                    parentSelected = true;
                    elementToCheckScroll = parentAsHtmlElement;
                    parentAsHtmlElement = elementToCheckScroll.parentElement as HTMLElement;
                }
            }

            if (parentSelected && !scrollValidation(elementToCheckScroll)) continue;

            return elementToCheckScroll;
        }
    };

    /**
     * Gets the stack of elements (topmost-bottommost) at this position and return the first non-
     * cursor element. Depends on all cursor elements being branded with the "cursor" class.
     * @param elementsAtPos - Elements at the position to check
     * @returns First non-cursor element or null if none found
     */
    private getTopNonCursorElement(elementsAtPos: Element[] | null): Element | null {
        let elementAtPos: Element | null = null;

        if (elementsAtPos !== null) {
            for (let i = 0; i < elementsAtPos.length; i++) {
                if (
                    !elementsAtPos[i].classList.contains('touchfreecursor') &&
                    !elementsAtPos[i].classList.contains('touchfree-cursor')
                ) {
                    elementAtPos = elementsAtPos[i];
                    break;
                }
            }
        }

        return elementAtPos;
    }

    /**
     * Handle sending pointerleave/pointerenter events to the parent stacks.
     * These events do not bubble, in order to deliver expected behaviour we must consider
     * the entire stack of elements above our current target in the document tree
     * @param element - Element to handle
     */
    private handleEnterLeaveBehaviour(element: Element | null) {
        const oldParents: Array<Node | null> = this.getOrderedParents(this.lastHoveredElement);
        const newParents: Array<Node | null> = this.getOrderedParents(element);

        const highestCommonIndex: number | null = this.getCommonAncestorIndex(oldParents, newParents);

        const leaveEvent = new PointerEvent('pointerleave', this.activeEventProps);
        const enterEvent = new PointerEvent('pointerenter', this.activeEventProps);

        if (highestCommonIndex === null) {
            oldParents.forEach((parentNode) => {
                parentNode?.dispatchEvent(leaveEvent);
            });

            newParents.forEach((parentNode: Node | null) => {
                parentNode?.dispatchEvent(enterEvent);
            });
        } else {
            oldParents.slice(highestCommonIndex).forEach((parentNode) => {
                parentNode?.dispatchEvent(leaveEvent);
            });

            newParents.slice(highestCommonIndex).forEach((parentNode) => {
                parentNode?.dispatchEvent(enterEvent);
            });
        }
    }

    /**
     * Collects the stack of parent nodes, ordered from highest (document body) to lowest
     * (the node provided)
     * @param node - Lowest node in the stack
     * @returns Parent nodes until the provided node
     */
    private getOrderedParents(node: Node | null): Array<Node | null> {
        const parentStack: Array<Node | null> = [node];

        for (; node; node = node.parentNode) {
            parentStack.unshift(node);
        }

        return parentStack;
    }

    /**
     * Takes two ordered arrays of Nodes (as produced by {@link GetOrderedParents}) and identifies the
     * lowest common ancestor of the two sets. Used in {@link handleMove} for identifying the events to send
     * @param oldParents - First stack of parents
     * @param newParents - Second stack of parents
     * @returns Index of lowest common ancestor between the two stacks
     */
    private getCommonAncestorIndex(oldParents: Array<Node | null>, newParents: Array<Node | null>): number | null {
        if (oldParents[0] !== newParents[0]) {
            return null;
        }

        for (let i = 0; i < oldParents.length; i++) {
            if (oldParents[i] !== newParents[i]) {
                return i;
            }
        }

        return null;
    }

    /**
     * Checks if the target element is null and correctly dispatches the provided event to the
     * element or document body appropriately
     * @param event - Event to dispatch
     * @param target - Element to dispatch event on if not null
     */
    private dispatchToTarget(event: PointerEvent, target: Element | null) {
        if (target !== null) {
            target.dispatchEvent(event);
        } else {
            document.dispatchEvent(event);
        }
    }
}

/**
 * The directions that a scroll can be in
 * @internal
 */
enum ScrollDirection {
    UP = 0,
    DOWN = 1,
    LEFT = 2,
    RIGHT = 3,
}
