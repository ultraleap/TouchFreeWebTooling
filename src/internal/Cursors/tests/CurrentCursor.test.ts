import { setCurrentCursor, getCurrentCursor } from '../CurrentCursor';
import { DotCursor } from '../DotCursor';
import { SVGCursor } from '../SvgCursor';

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
