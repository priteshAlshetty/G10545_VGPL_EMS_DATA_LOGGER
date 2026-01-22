
import cron from 'node-cron';
import { connectPLC  } from '../services/PLCConnect.js';
import { readDB } from '../services/DBRead.js';
import { processData } from '../services/processData.js';
import { dataEntries } from '../services/dataEntries.js';
import { CONFIG} from '../constants/plc.constant.js';
import { DB_LIST } from '../constants/plc.constant.js';
import { SCHEDULE_STRING} from '../scheduler/scheduler.js';
import { schedulerStatus } from '../constants/status.constants.js';
import { testDBConnect } from '../services/testDBConnect.js';

let task;

export function startScheduler() {
    task = cron.schedule(SCHEDULE_STRING, async () => {
        if (schedulerStatus.isRunning) {
            console.warn('Previous cycle still running, skipping');
            return;
        }
        try {
            schedulerStatus.isRunning = true;
        
            await connectPLC({config: CONFIG.client, plcIP: CONFIG.plcIP, rack: CONFIG.rack, slot: CONFIG.slot })
            schedulerStatus.plcConnected = true;

            for (const db of DB_LIST) {
                const DBBUFFER = await readDB({client: CONFIG.client, DBNumber: db, startBytes: CONFIG.startBytes, meterSize: CONFIG.meterSize, meterCount: CONFIG.meterCount})
                const RESULT = await processData({DBBUFFER,  DBNumber: db, meterSize: CONFIG.meterSize, meterCount: CONFIG.meterCount})
                schedulerStatus.dbConnected = testDBConnect();
                await dataEntries(RESULT);
            }

            console.log('Scheduled task executed successfully at :', new Date().toLocaleString());
            schedulerStatus.isRunning = false;
            schedulerStatus.lastRun = new Date().toLocaleString();
            schedulerStatus.plcConnected = false;
            schedulerStatus.dbConnected = false;
        }

        catch (error) {
            schedulerStatus.isRunning = false;
            schedulerStatus.lastError = error;
            console.log('Scheduler Fuction Status:', scedulerStatus)
            console.error('Error in scheduled task:', error);
        }
    });
}

//tartScheduler();

export function stopScheduler() {
    if (task) {
        task.stop();
        console.log('Scheduler Stopped!');
    }
}
