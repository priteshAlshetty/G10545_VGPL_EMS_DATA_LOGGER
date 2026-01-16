import {
    createPLCClient,
    processData,
    dataEntries
} from './newLogic.js';
const client = createPLCClient();

const config = {
    client,
    plcIP: '192.168.0.205',
    rack: 0,
    slot: 1,
    DBNumber: 1,
    startBytes: 0,
    meterSize: 72,
    meterCount: 5,
    meterNames: [
        'htsb1mfm1',
        'htsb1mfm2',
        'htsb1mfm3',
        'htsb1mfm4',
        'htsb1mfm5'
    ]
};

async function run() {
    try{
        const result = await processData(config);
        console.log(result.STATUS);
        console.log('PROCESS RESULT:', result);

        if (!result.STATUS) {
            throw new Error('PLC read failed. No DB insert...!');
        }
        await dataEntries({
            meterNames: config.meterNames,
            meterCount: config.meterCount,
            result
        });
        console.log('Inserted into the Database');

    } catch(err){
        throw err;
    }

}

await run();

// run().catch(err => {
//     console.error('RUN ERROR:', err.message);
// });
