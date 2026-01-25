
import cron from 'node-cron';
import { connectPLC  } from '../services/PLCConnect.js';
import { readDB } from '../services/DBRead.js';
import { processData } from '../services/processData.js';
import { dataEntries } from '../services/dataEntries.js';
import { CONFIG } from '../constants/plc.constant.js';
import { DB_LIST } from '../constants/plc.constant.js';
import { SCHEDULE_STRING } from '../constants/scheduler.constants.js';
import { testDBConnect } from '../services/testDBConnect.js';

export let task;
let isRunning = false;
let result = await connectPLC({client: CONFIG.client, plcIP: CONFIG.plcIP, rack: CONFIG.rack, slot: CONFIG.slot});

export function startScheduler() {

    task = cron.schedule(SCHEDULE_STRING, async () => {
        if (isRunning) {
            console.warn('Previous cycle still running, skipping');
            return;
        } 
        
        isRunning = true;
        
        try {
            
            if(!result.status){
                console.error('PLC Connection failed:', RESULT.error);
                return;
            }

            for (const db of DB_LIST) {

                const DBBUFFER = await readDB({client: CONFIG.client, DBNumber: db, startBytes: CONFIG.startBytes, meterSize: CONFIG.meterSize, meterCount: CONFIG.meterCount})
                const RESULT = await processData({DBBUFFER,  DBNumber: db, meterSize: CONFIG.meterSize, meterCount: CONFIG.meterCount})
                testDBConnect();
                await dataEntries(RESULT);
            }

            console.log('Scheduled task executed successfully at :', new Date().toLocaleString());

        } catch (error) {
            console.log(error);
            console.log('Re-connecting PLC...');
            result = await connectPLC({client: CONFIG.client, plcIP: CONFIG.plcIP, rack: CONFIG.rack, slot: CONFIG.slot});

        } finally{
            isRunning = false;
        }
    });
}

export function stopScheduler() {
    if (task) {
        task.stop();
        console.log('Scheduler Stopped!');
    }
}
