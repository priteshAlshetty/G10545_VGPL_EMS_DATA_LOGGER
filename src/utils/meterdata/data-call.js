import fs from 'fs';
import {
    createPLCClient,
    processData,
    dataEntries
} from './data.js';
const client = createPLCClient();
const DBNumber = 5;
let DBName = "DB" + String(DBNumber);
const tableNames = [];
for(let i = 1; i <= 6; i++){
    for(let k = 1; k <= 12; k++){
        const tableName = `${DBName}G${i}M${k}`;
        tableNames.push(tableName);
    }
}
//console.log(tableNames.length);
//console.log(tableNames);

const config = {
    client,
    plcIP: '192.168.1.10',
    rack: 0,
    slot: 1,
    DBNumber: 39,
    startBytes: 0,
    meterSize: 72,
    meterCount: 72,
};

async function run() {
    try{
        const result = await processData(config);
        console.log(result.STATUS);
        //console.log('PROCESS RESULT:', result);
        
        if (!result.STATUS) {
            throw new Error('PLC read failed. No DB insert...!');
        }
        await dataEntries(result);
        console.log('Inserted into the Database');

    } catch(err){
        throw err;
    }
}

await run();

// run().catch(err => {
//     console.error('RUN ERROR:', err.message);
// });
