import { getCurrentServiceAddress, connect } from '../ConnectionApi';
import { Address } from '../ConnectionTypes';

describe('ConnectionApi', () => {
    const checkAddress = (address: Address) => {
        expect(getCurrentServiceAddress().ip).toBe(address.ip);
        expect(getCurrentServiceAddress().port).toBe(address.port);
    };
    it('should update the current port and ip when connect is called', () => {
        const newAddress = { ip: '192.168.0.1', port: '8080' };
        checkAddress({ ip: '127.0.0.1', port: '9739' });
        connect(newAddress);
        checkAddress(newAddress);
    });
});
