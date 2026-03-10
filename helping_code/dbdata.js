import pool from './db.js'
import fs from 'fs';
import snap7 from 'node-snap7';
const client = new snap7.S7Client();

// const file = fs.readFileSync('meterNames.json', 'utf8');
// const jsonData = JSON.parse(file);
// const meter_names = jsonData.meters;

const meter_names = ["htsb1mfm1","htsb1mfm2","htsb1mfm3","htsb1mfm4","htsb1mfm5"];

async function readPLCs7DB( {pool, client, plc_ip, rack, slot, DB_number, meter_size, 
    meter_count, meterNames, POLL_INTERVAL, RECONNECT_DELAY} ){
    
    let result = {};
    const allowed_tables = new Set(meterNames);
    const total_bytes = meter_size * meter_count;

    // STATE 
    let pollTimer = null;
    let plcConnected = false;
    let reconnecting = false;

    //const POLL_INTERVAL = 5000;
    //const RECONNECT_DELAY = 5000;

    //handle float values
    function readFloatSafe(buf, offset) {
        try {
            if (offset + 4 > buf.length) return null;
            const v = buf.readFloatBE(offset);
            return Number.isFinite(v) ? v : null;
        } catch {
            return null;
        }
    }

    // read PLC data block DB.X
    async function readPLCDB(){
        return new Promise((resolve, reject) => {
            client.DBRead(DB_number, 0, total_bytes, (err, data) => {
                if(err) return reject(err);
                if(data.length != total_bytes){
                    return reject(new Error('Partial DB read'));
                }

                resolve(data)
            });
        });
    }


    // PROCESS Data
    async function processMeters(buf) {

        for (let i = 0; i < meter_count; i++) {
            const base = i * meter_size;
            let meter = meterNames[i];

            result[meter] = {
                CURRENT_I1: readFloatSafe(buf, base + 0),
                CURRENT_I2: readFloatSafe(buf, base + 4),
                CURRENT_I3: readFloatSafe(buf, base + 8),
                VOLTAGE_V1: readFloatSafe(buf, base + 12),
                VOLTAGE_V2: readFloatSafe(buf, base + 16),
                VOLTAGE_V3: readFloatSafe(buf, base + 20),
                FREQUENCY: readFloatSafe(buf, base + 24),
                KW: readFloatSafe(buf, base + 28),
                KWH: readFloatSafe(buf, base + 32),
                COS_PHI: readFloatSafe(buf, base + 36),
                KW_DEMAND: readFloatSafe(buf, base + 40),
                CUMULATIVE_THD_I: readFloatSafe(buf, base + 44),
                CUMULATIVE_THD_V: readFloatSafe(buf, base + 48),
                KVA: readFloatSafe(buf, base + 52),
                KVAR: readFloatSafe(buf, base + 56),
                SPARE1: readFloatSafe(buf, base + 60),
                SPARE2: readFloatSafe(buf, base + 64),
                SPARE3: readFloatSafe(buf, base + 68)
            };
        }
        return result;
    }

    // polling
    async function startPolling(){
        if(pollTimer) return;

        pollTimer = setInterval(async () => {
            try{
                const buf = await readPLCDB();

                
                console.log('PLC DB Data...');
                console.log(await processMeters(buf)) ;
                //return await processMeters(buf);

            } catch(err){
                console.error('PLC communication lost:', client.ErrorText(err));
                handlePLCFailure()
            }
        }, POLL_INTERVAL)
    }

    // stop
    function stopPolling(){
        if(pollTimer){
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    // failure handler
    function handlePLCFailure(){
        if(!plcConnected) return;

        plcConnected = false;
        stopPolling();

        try{ client.Disconnect(); } catch{}

        if(!reconnecting){
            reconnecting = true;
            console.log('Waiting for PLC reconnection...');
            setTimeout(connectPLC, RECONNECT_DELAY);
        }
    }

    // connect to PLC
    async function connectPLC(){
        reconnecting = false;

        await client.ConnectTo(plc_ip, rack, slot, (err) => {
            if(err){
                console.error('PLC connect failed:', client.ErrorText(err));
                setTimeout(connectPLC, RECONNECT_DELAY);
                return;
            }

            plcConnected = true;
            console.log('PLC connected...');
            startPolling();
        });
    }

    // disconnect or shutdown.
    process.on('SIGINT', () => {
        console.log('Ctrl+C pressed, process will shutdown.');
        stopPolling();
        client.Disconnect();
        process.exit(0);
    });

    // start 
    connectPLC();
}

const data = await readPLCs7DB( {pool: pool, client: client, plc_ip: '192.168.0.205', rack: 0, slot: 1, 
    DB_number: 1, meter_size: 72, meter_count: 5, meterNames: meter_names, POLL_INTERVAL: 5000, RECONNECT_DELAY: 5000 });

console.log(data);