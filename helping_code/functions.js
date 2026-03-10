import snap7 from 'node-snap7';
const client = snap7.S7Client();
import pool from '/db.js';

async function readFloatSafe(buf, offset){
    try{
        if(offset + 4 > buf.length) return null;
        let val = buf.readFloatBE(offset);
        return Number.isFinite(val) ? val : null;
    } catch{
        return null;
    }
}

async function connectPLC( {plcIP, rack, slot, reconnecting, reconnectDelay, plcConnected} ){

    reconnecting = false;

    client.ConnectTo(plcIP, rack, slot, (err) => {
        if(err){
            console.error('PLC connect failed:', client.ErrorText(err));
        }
        setTimeout(connectPLC, reconnectDelay);
        return;
    })

    plcConnected = true;
    console.log('PLC Connected!');
}

async function readDB( {DBNumber, startBytes, meterSize, meterCount, meterNames} ){

    let buf;
    await client.DBRead(DBNumber, startBytes, meterSize * meterCount, (err, data) => {
        
        if(err !== 0){
            throw new Error('DBRead Error:', client.ErrorText(err));
        }     
        if(!Buffer.isBuffer(data)){
            throw new Error('Buffer Error: Invalid data type received.')
        }   
        if(data.length != meterSize * meterCount){
            throw new Error('Partial DB read:', client.ErrorText(err))
        }
        if(meterCount !== meterNames.length){
            throw new Error('Meter entry Error: Meter count and count of meters name not matched.')
        }

        try{
            let result = {};

            for(let i = 0; i < meterCount; i++){
                let base = i * meterNames;
                let meterName = meterNames[i];

                result[meterName] = {
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
                }
            }

            if(!result){
                console.error('Empty result, no data in return object.')
                return null;
            }
            return result;

        } catch(err){
            throw new Error('Error: Error in processing Buffer Data:', err)
        }
    })
}

async function handlePLCFailure( {plcConnected, client, reconnecting, reconnectDelay} ){
    if(!plcConnected) return;
    plcConnected = false;

    try{ client.Disconnect(); } catch{}

    if(!reconnecting){
        reconnecting = true;
        console.log('Waiting for PLC reconnection...');
        setTimeout(connectPLC, reconnectDelay)
    }
}