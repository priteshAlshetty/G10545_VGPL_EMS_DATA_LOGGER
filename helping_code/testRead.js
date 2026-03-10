import {
    createPLCClient,
    createPLCState,
    connectPLC,
    readMeters
} from './plcReader.js';

const client = createPLCClient();
const state = createPLCState();

const config = {
    plcIP: '192.168.0.205',
    rack: 0,
    slot: 1,
    reconnectDelay: 5000,
    DBNumber: 1,
    startBytes: 0,
    meterSize: 72,
    meterCount: 5,
    meterNames: ["htsb1mfm1","htsb1mfm2","htsb1mfm3","htsb1mfm4","htsb1mfm5"]
};

connectPLC({ client, state, ...config });

setTimeout(async () => {
    try {
        const data = await readMeters({ client, state, ...config });
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Read failed:', err.message);
    }
}, 5000);
