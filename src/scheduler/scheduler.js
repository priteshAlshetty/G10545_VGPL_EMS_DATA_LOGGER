
import cron from 'node-cron';
import { connectPLC  } from '../services/PLCConnect.js';
import { readDB } from '../services/DBRead.js';
import { processData } from '../services/processData.js';
import { dataEntries } from '../services/dataEntries.js';
import { CONFIG } from '../constants/plc.constant.js';
//import { DB_LIST } from '../constants/plc.constant.js';
import { SCHEDULE_STRING } from '../constants/scheduler.constants.js';
import { testDBConnect } from '../services/testDBConnect.js';

export let task;
let isRunningstartScheduler = false;
//let result = await connectPLC({client: CONFIG.client, plcIP: CONFIG.plcIP, rack: CONFIG.rack, slot: CONFIG.slot});

export async function startScheduler() {

    task = cron.schedule(SCHEDULE_STRING, async () => {
        if (isRunningstartScheduler) {
            console.warn('Previous cycle still running, skipping');
            return;
        } 
        
        isRunningstartScheduler = true;
        
        try {
            const isConnectPLC = await connectPLC({client: CONFIG.client, plcIP: CONFIG.plcIP, rack: CONFIG.rack, slot: CONFIG.slot})
            if(!isConnectPLC.status){
                console.error('PLC Connection failed:', isConnectPLC.error);
                return;
            }

            for (const db of CONFIG.DBList) {

                const DBBUFFER = await readDB({client: CONFIG.client, DBNumber: db, startBytes: CONFIG.startBytes, meterSize: CONFIG.meterSize, meterCount: CONFIG.meterCount});
                console.log(`DB Buffer length: ${DBBUFFER.length}`);
                //console.log(DBBUFFER);
                const DATA = await processData({DBBuffer: DBBUFFER,  DBNumber: db, meterSize: CONFIG.meterSize, meterCount: CONFIG.meterCount, gatewayCount: CONFIG.gatewayCount});
                //console.log(DATA);
                //await testDBConnect();
                await dataEntries(DATA);
            }

            console.log('Scheduled task executed successfully at :', new Date().toLocaleString());

        } catch (error) {
            console.log(error);
            console.log('Re-connecting PLC...');
            result = await connectPLC({client: CONFIG.client, plcIP: CONFIG.plcIP, rack: CONFIG.rack, slot: CONFIG.slot});

        } finally{
            isRunningstartScheduler = false;
        }
    });
}

export function stopScheduler() {
    if (task) {
        task.stop();
        console.log('Scheduler Stopped!');
    }
}
