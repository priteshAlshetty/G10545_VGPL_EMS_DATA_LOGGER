
import snap7 from 'node-snap7';
const client =  snap7.S7Client()

export const CONFIG = {
    client: client,
    plcIP: '192.168.0.20',
    rack: 0,
    slot: 1,
    DBList: [5], //add PLC DB Number here
    gatewayCount: 6,
    meterCount: 12,
    startBytes: 0,
    meterSize: 72,
    maxRetries: 5,
    delayMs: 5000
};