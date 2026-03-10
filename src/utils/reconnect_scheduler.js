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

    const plcConnection = await connectPLC({
        client: CONFIG.client,
        plcIP: CONFIG.plcIP,
        rack: CONFIG.rack,
        slot: CONFIG.slot
    });

    if (!plcConnection.status) {
        console.error("Initial PLC connection failed:", plcConnection.error);
        console.log("Scheduler will attempt reconnection automatically...");
    } else {
        console.log("PLC Connected Successfully");
    }

    const databaseStatus = await testDBConnect();

    if (!databaseStatus) {
        console.error("Database connection failed. Scheduler will still run.");
    } else {
        console.log("Database Connected Successfully");
    }
    
    // CRON SCHEDULER START
    task = cron.schedule(SCHEDULE_STRING, async () => {

        if (isRunningstartScheduler) {
            console.warn("Previous cycle still running, skipping...");
            return;
        }

        isRunningstartScheduler = true;

        try {
            //CHECK PLC CONNECTION
            if (!CONFIG.client.Connected()) {

                console.warn("PLC not connected. Attempting reconnect...");

                const reconnect = await connectPLC({
                    client: CONFIG.client,
                    plcIP: CONFIG.plcIP,
                    rack: CONFIG.rack,
                    slot: CONFIG.slot
                });

                if (!reconnect.status) {
                    console.error("PLC Reconnection Failed:", reconnect.error);
                    return;
                }
                console.log("PLC Reconnected Successfully");
            }

            //READ PLC DB DATA
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
            console.log("Scheduled task executed successfully at:", new Date().toLocaleString());

        } catch (error) {

        // SNAP7 ERROR HANDLING
            if (error?.code === 36700160 || error === 36700160) {
                console.error(`
                    Possible Error:
                        1. DB size mismatch with configured size
                        2. PUT/GET access disabled in PLC
                        3. Optimized block access enabled in DB
                    `);
            }
            console.error("Error occurred:", error);
        } finally {
            isRunningstartScheduler = false;
        }
    });
}

// STOP SCHEDULER
export function stopScheduler() {
    if (task) {
        task.stop();
        console.log("Scheduler Stopped!");
    }
}