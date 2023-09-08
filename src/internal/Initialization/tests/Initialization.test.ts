import { getCurrentServiceAddress } from '../../Connection/ConnectionApi';
import { setCurrentCursor, getCurrentCursor } from '../../Cursors/CurrentCursor';
import { SVGCursor } from '../../Cursors/SvgCursor';
import { init } from '../Initialization';

describe('Initialization', () => {
    describe('init', () => {
        const checkDefaultCursor = (initialiseCursor: boolean | undefined) => {
            setCurrentCursor(undefined);
            let cursor = getCurrentCursor();
            expect(cursor).toBe(undefined);
            init({ initialiseCursor: initialiseCursor });
            cursor = getCurrentCursor();
            expect(cursor instanceof SVGCursor).toBe(true);
        };

        it('Should create an SVGCursor when initialiseCursor is undefined', () => checkDefaultCursor(undefined));

        it('Should create an SVGCursor when initialiseCursor is true', () => checkDefaultCursor(true));

        it('Should pass a given address to connect', () => {
            const newAddress = { ip: '192.168.0.1', port: '8080' };
            init({ address: newAddress });
            expect(getCurrentServiceAddress().ip).toBe(newAddress.ip);
            expect(getCurrentServiceAddress().port).toBe(newAddress.port);
        });
    });
});
