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

async function connectPLC( {client, plcIP, rack, slot} ){
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

async function readDB( {client, DBNumber, startBytes, meterSize, meterCount} ){
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

export async function processData({client, plcIP, rack, slot, DBNumber, startBytes, meterSize, meterCount, meterNames}) {
    const result = {
        STATUS: false,
        DATA: null
    };

    if(!Array.isArray(meterNames)){
        console.error('Error in processing DB data: meterNames must be an array');
        return result;
    }
    if(!meterCount || !Number.isInteger(meterCount) || meterCount <= 0){
        console.error('Error in processing DB data: meterNames must be a positive integer.');
        return result;
    }   
    if(meterNames.length !== meterCount){
        console.error('Error in processing DB data: meterNames length must match meterCount');
        return result;
    }
 
    try{
        await connectPLC({client, plcIP, rack, slot});
        const buf = await readDB({client, DBNumber, startBytes, meterSize, meterCount})
        const data = {};
        const allowedTables = new Set(meterNames);

        for(let i = 0; i < meterCount; i++){
            const base = i * meterSize;
            const meter = meterNames[i];
            if(!allowedTables.has(meter)){
                console.error('Error in proccssing DB data: meter name not matched with table name');
                return result;
            }

            data[meter] = {
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
export async function dataEntries({meterNames, meterCount, result}){

    if(!meterNames || !Array.isArray(meterNames)){
        throw new TypeError('meterNames must be an array')
    }
    if(!meterCount || !Number.isInteger(meterCount) || meterCount <= 0){
        throw new TypeError('meterNames must be a positive integer.')
    }
    if( meterNames.length !== meterCount ){
        throw new TypeError('Meter names count and actual meterCount not matched or improper/invalid inputs for meterNames or meterCount')
    }  
    
    const allowedTables = new Set(meterNames)

    try{
        for(let i = 0; i < meterCount; i++){
            
            const meter = meterNames[i];
            if(!allowedTables.has(meter)){
                throw new Error(`Meter name not matched with table name: ${meter}`)
            }

            const meterData = result.DATA[meter];
            if(!meterData || Array.isArray(meterData) || typeof meterData !== 'object'){
                throw new TypeError('meterData is empty or meterData must be a plain object')
            }

            const sql = `
                INSERT INTO ${meter} (
                CURRENT_I1,CURRENT_I2,CURRENT_I3,
                VOLTAGE_V1,VOLTAGE_V2,VOLTAGE_V3,
                FREQUENCY,KW,KWH,COS_PHI,KW_DEMAND,
                CUMULATIVE_THD_IL,CUMULATIVE_THD_V,
                KVA,KVAR,SPARE1,SPARE2,SPARE3
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,
                    $10,$11,$12,$13,$14,$15,$16,$17,$18
                )
            `;

            const dbResult = await pool.query(sql, [
                meterData.CURRENT_I1, meterData.CURRENT_I2, meterData.CURRENT_I3,
                meterData.VOLTAGE_V1, meterData.VOLTAGE_V2, meterData.VOLTAGE_V3,
                meterData.FREQUENCY, meterData.KW, meterData.KWH,
                meterData.COS_PHI, meterData.KW_DEMAND,
                meterData.CUMULATIVE_THD_I, meterData.CUMULATIVE_THD_V,
                meterData.KVA, meterData.KVAR,
                meterData.SPARE1, meterData.SPARE2, meterData.SPARE3
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
