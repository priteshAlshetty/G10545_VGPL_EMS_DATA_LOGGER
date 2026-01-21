import snap7 from 'node-snap7';
const client = new snap7.S7Client();
import pool from './db.js'

export function createPLCClient(){
    return new snap7.S7Client()
}

function readFloatSafe(buf, offset) {
    try{
        if(offset + 4 > buf.length) return null;
        let val = buf.readFloatBE(offset);
        return Number.isFinite(val) ? val : null;
    } catch{
        return null;
    }
}

export async function connectPLC( {client, plcIP, rack, slot} ){
    if (!client) {
        throw new Error('Error in connecting PLC: PLC client is required');
    } 
    if(!Number.isInteger(rack)){
        throw new TypeError(`Error in connecting PLC: rack must be a positive integer: ${rack}`);
    }  
    if(!Number.isInteger(slot)){
        throw new TypeError(`Error in connecting PLC: slot must be a positive integer: ${slot}`);
    } 
    if(!typeof plcIP === 'string' || plcIP.length === 0){
        throw new TypeError(`Error in connecting PLC: plcIP must be a non-empty string: ${plcIP}`)
    }

    return new Promise((resolve, reject) => {
        client.ConnectTo(plcIP, rack, slot, (err) => {
            if(err){
                console.error('PLC Connecte failed:', client.ErrorText(err));
                console.log('Error in connecting PLC:', err);
                return reject(err)
            }
            console.log('PLC Connected!');
            resolve(true)
        })
    })
}

export async function readDB( {client, DBNumber, startBytes, meterSize, meterCount} ){
    if(!meterCount || !Number.isInteger(meterCount) || meterCount <= 0){
        throw new TypeError(`Error in reading DB data: meterNames must be a positive integer: ${meterCount}`);
    } 
    if(!meterSize || !Number.isInteger(meterSize) || meterSize <= 0){
        throw new TypeError(`Error in reading DB data: meterSize must be a positive integer: ${meterSize}`);
    } 
    if(!Number.isInteger(startBytes)){
        throw new TypeError(`Error in reading DB data: startBytes must be an integer: ${startBytes}`);
    } 
    if(!DBNumber || !Number.isInteger(DBNumber)){
        throw new TypeError(`Error in reading DB data: DBNumber must be a positive integer: ${DBNumber}`);
    }
    if (!client) {
        throw new Error('Error in reading DB data: PLC client is required');
    }

    return new Promise((resolve, reject) => {
        const totalBytes = meterSize*meterCount;

        client.DBRead(DBNumber, startBytes, totalBytes, (err, data) => {
            if(err) return reject(err);
            if(!Buffer.isBuffer(data) || data.length !== totalBytes){
                return reject(new Error('Partial DB read'))
            }
            resolve(data);
        });
    });
}

export async function processData({client, plcIP, rack, slot, DBNumber, startBytes, meterSize, meterCount}) {
    
    const result = {
        STATUS: false,
        DATA: null
    };

    if(!meterCount || !Number.isInteger(meterCount) || meterCount <= 0){
        console.error('Error in processing DB data: meterNames must be a positive integer.');
        return result;
    }   
    if(!DBNumber || !Number.isInteger(DBNumber) || DBNumber <= 0){
        console.error('Error in processing DB data: DBNumber must be a positive integer:', DBNumber );
        return result;
    }   
    let DBName = "DB" + String(DBNumber);
    const tableNames = [];
    for(let i = 1; i <= 6; i++){
        for(let k = 1; k <= 12; k++){
            const tableName = `${DBName}G${i}M${k}`;
            tableNames.push(tableName);
        }
    }
    const tableCount = tableNames.length;
    if(tableCount !== meterCount){
        console.error('Error in processing DB data: meterNames length must match meterCount');
        return result;
    }
    const allowedTables = new Set(tableNames);
 
    try{
        await connectPLC({client, plcIP, rack, slot, DBBuffer});
        const buf = await readDB({client, DBNumber, startBytes, meterSize, meterCount})
        const data = {};
        
        for(let i = 0; i < tableCount; i++){
            const base = i * meterSize;
            const meter = tableNames[i];
            if(!allowedTables.has(meter)){
                console.error('Error in proccssing DB data: meter name not matched with table name');
                return result;
            }

            data[meter] = {
                Active_Energy: readFloatSafe(buf, base + 0),
                Reactive_Power: readFloatSafe(buf, base + 4),
                Apparent_Power: readFloatSafe(buf, base + 8),
                Current_I1: readFloatSafe(buf, base + 12),
                Current_I2: readFloatSafe(buf, base + 16),
                Current_I3: readFloatSafe(buf, base + 20),
                Voltage_V1: readFloatSafe(buf, base + 24),
                Voltage_V2: readFloatSafe(buf, base + 28),
                Voltage_V3: readFloatSafe(buf, base + 32),
                Active_Power: readFloatSafe(buf, base + 36),
                Frequency: readFloatSafe(buf, base + 40),
                Power_Factor: readFloatSafe(buf, base + 44),
                KW_Demand: readFloatSafe(buf, base + 48),
                THD_IL: readFloatSafe(buf, base + 52),
                THD_V: readFloatSafe(buf, base + 56),
                Spare1: readFloatSafe(buf, base + 60),
                Spare2: readFloatSafe(buf, base + 64),
                Spare3: readFloatSafe(buf, base + 68)         
            };
        }
        result.STATUS = true;
        result.DATA = data;
        return result;

    } catch(err){
        console.error('DB Data Processing Error:', err.message);
        result.STATUS = false;
        result.DATA = null;
        // result.error =err;
        console.dir(err);
        return result;
    }
}

// database insert query
export async function dataEntries(result){
    if(!result.STATUS){
        throw new TypeError('No meter data, there is no status flag.')
    }
    const tableNames = Object.keys(result.DATA);
    const tableCount = tableNames.length
    if(tableCount === 0){
        throw new TypeError('Meter data is empty')
    }
    if(!tableNames || !Array.isArray(tableNames)){
        throw new TypeError('tableNames must be an array')
    }
    if(!tableCount || !Number.isInteger(tableCount) || tableCount <= 0){
        throw new TypeError('meterNames must be a positive integer.')
    }
    
    const allowedTables = new Set(tableNames)

    try{
        for(let i = 0; i < tableCount; i++){
            
            const meter = tableNames[i];
            if(!allowedTables.has(meter)){
                throw new Error(`Meter name not matched with table name: ${meter}`)
            }

            const meterData = result.DATA[meter];
            if(!meterData || Array.isArray(meterData) || typeof meterData !== 'object'){
                throw new TypeError('meterData is empty or meterData must be a plain object')
            }

            const sql = `
                INSERT INTO ${meter} (
                    Active_Energy,
                    Reactive_Power,
                    Apparent_Power,
                    Current_I1,
                    Current_I2,
                    Current_I3,
                    Voltage_V1,
                    Voltage_V2,
                    Voltage_V3,
                    Active_Power,
                    Frequency,
                    Power_Factor,
                    KW_Demand,
                    THD_IL,
                    THD_V,
                    Spare1,
                    Spare2,
                    Spare3

                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,
                    $10,$11,$12,$13,$14,$15,$16,$17,$18
                )
            `;

            const dbResult = await pool.query(sql, [
                meterData.Active_Energy, meterData.Reactive_Power, meterData.Apparent_Power,
                meterData.Current_I1, meterData.Current_I2, meterData.Current_I3,
                meterData.Voltage_V1, meterData.Voltage_V1, meterData.Voltage_V1,
                meterData.Active_Power, meterData.Frequency,
                meterData.Power_Factor, meterData.KW_Demand,
                meterData.THD_IL, meterData.THD_V,
                meterData.Spare1, meterData.Spare2, meterData.Spare3
            ]);
                
            if(dbResult.rowCount === 0){
            throw new Error('Insert failed: No rows affected')
            }
        }

    } catch(err){
        console.error('[dataEntries]', err.code, err.message);
        throw err;
    }
}
