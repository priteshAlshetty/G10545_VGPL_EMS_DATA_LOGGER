import cron from 'node-cron';
import { connectPLC } from '../services/PLCConnect.js';
import { readDB } from '../services/DBRead.js';
import { processData } from '../services/processData.js';
import { dataEntries } from '../services/dataEntries.js';
import { CONFIG } from '../constants/plc.constant.js';
import { SCHEDULE_STRING } from '../constants/scheduler.constants.js';
import { testDBConnect } from '../services/testDBConnect.js';

export let task;
let isRunningstartScheduler = false;

export async function startScheduler() {

    // Connect PLC once when scheduler starts
    const plcConnection = await connectPLC({
        client: CONFIG.client,
        plcIP: CONFIG.plcIP,
        rack: CONFIG.rack,
        slot: CONFIG.slot
    });

    if (!plcConnection.status) {
        console.error('Initial PLC Connection failed:', plcConnection.error);
        return;
    }

    console.log('PLC Connected Successfully');

    task = cron.schedule(SCHEDULE_STRING, async () => {

        if (isRunningstartScheduler) {
            console.warn('Previous cycle still running, skipping...');
            return;
        }

        isRunningstartScheduler = true;

        try {

            // Check DB connection once
            const databaseStatus = await testDBConnect();

            if (!databaseStatus) {
                console.error("Database connection failed");
                return;
            }

            for (const db of CONFIG.DBList) {

                const DBBUFFER = await readDB({
                    client: CONFIG.client,
                    DBNumber: db,
                    startBytes: CONFIG.startBytes,
                    meterSize: CONFIG.meterSize,
                    meterCount: CONFIG.meterCount,
                    gatewayCount: CONFIG.gatewayCount
                });

                const DATA = await processData({
                    DBBuffer: DBBUFFER,
                    DBNumber: db,
                    meterSize: CONFIG.meterSize,
                    meterCount: CONFIG.meterCount,
                    gatewayCount: CONFIG.gatewayCount
                });

                await dataEntries(DATA);
            }

            console.log('Scheduled task executed successfully at:', new Date().toLocaleString());

        } catch (error) {

            if(error?.code === 36700160 || error === 36700160){
                console.error(`
                    Possible Error:
                    1. DB Size not mached with the required size as configured.
                    2. PUT/GET Access Disabled.
                    3. Optimized Block Access Enabled, required uncheck tick `)
            }

            console.error('Error occurred:', error);

            console.log('Attempting PLC reconnection...');

            const reconnect = await connectPLC({
                client: CONFIG.client,
                plcIP: CONFIG.plcIP,
                rack: CONFIG.rack,
                slot: CONFIG.slot
            });

            if (reconnect.status) {
                console.log('PLC Reconnected Successfully');
            } else {
                console.error('PLC Reconnection Failed:', reconnect.error);
            }

        } finally {
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
