import { createPLCClient } from '../services/PLCConnect.js';
const client = createPLCClient();

export const DB_LIST = [5, 8, 17, 24, 27, 30, 33, 36, 39];// example PLC DB numbers

export const CONFIG = {
    client: client,
    plcIP: '192.168.1.10',
    rack: 0,
    slot: 1,
    DBNumber: null,
    startBytes: 0,
    meterSize: 72,
    meterCount: 72,
};