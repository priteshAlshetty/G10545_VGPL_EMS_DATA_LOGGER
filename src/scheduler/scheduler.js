
import cron from 'node-cron';
import { createPLCClient, connectPLC  } from '../services/PLCConnect.js';
import { readDB } from '../services/DBRead.js';
import { processData } from '../services/processData.js';
import { dataEntries } from '../services/dataEntries.js';

const DB_LIST = [5, 8, 17, 24, 27, 30, 33, 36, 39];// example PLC DB numbers
const client = createPLCClient()
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

const SCHEDULE_STRING = '*/5 * * * * *'; // every 5 seconds for testing, change as needed
let task;
const scedulerStatus = {
    isRunning: false,
    plcConnected : false,
    dbConnected : false,
    lastRun : null,
    lastError : null
}

export function startScheduler() {
    task = cron.schedule(SCHEDULE_STRING, async () => {
        if (scedulerStatus.isRunning) {
            console.warn('Previous cycle still running, skipping');
            return;
        }
        try {
            scedulerStatus.isRunning = true;
        
            await connectPLC({client, plcIP: config.plcIP, rack: config.rack, slot: config.slot })
            scedulerStatus.plcConnected = true;

            for (const db of DB_LIST) {
                const DBBuffer = await readDB({client, DBNumber: db, startBytes: config.startBytes, meterSize: config.meterSize, meterCount: config.meterCount})
                const result = await processData({client, DBBuffer,  DBNumber: db, startBytes: config.startBytes, meterSize: config.meterSize, meterCount: config.meterCount})
                await dataEntries(result);
                scedulerStatus.dbConnected = true;
            }

            console.log('Scheduled task executed successfully at :', new Date().toLocaleString());
            scedulerStatus.isRunning = false;
            scedulerStatus.lastRun = new Date().toLocaleString();
            scedulerStatus.plcConnected = false;
            scedulerStatus.dbConnected = false;
        }

        catch (error) {
            scedulerStatus.isRunning = false;
            scedulerStatus.lastError = error;
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
