import { setCurrentCursor, getCurrentCursor, init, SVGCursor, ConnectionManager } from 'TouchFree';

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

        it('Should pass a given address to the ConnectionManager', () => {
            const newAddress = { ip: '192.168.0.1', port: '8080' };
            init({ address: newAddress });
            expect(ConnectionManager.ipAddress).toBe(newAddress.ip);
            expect(ConnectionManager.port).toBe(newAddress.port);
        });
    });
});
