import { DotCursor, SVGCursor, setCurrentCursor, getCurrentCursor } from 'TouchFree';

describe('Cursors', () => {
    test('setCurrentCursor should set the cursor correctly', () => {
        const cursor = new SVGCursor();
        setCurrentCursor(cursor);
        expect(getCurrentCursor()).toBe(cursor);

        const newCursor = new DotCursor(new Image(), new Image());
        setCurrentCursor(newCursor);
        expect(getCurrentCursor()).toBe(newCursor);
    });
});
