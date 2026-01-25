
import { pool } from '../config/db.config.js';


// database insert query and data validation.
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
                meterData.Voltage_V1, meterData.Voltage_V2, meterData.Voltage_V3,
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
