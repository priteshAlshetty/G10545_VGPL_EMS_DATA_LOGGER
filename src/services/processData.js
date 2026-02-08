
// buffer data validation
function readFloatSafe(buf, offset) {
    try{
        let val = buf.readFloatBE(offset);
        return Number.isFinite(val) ? val : 0;
    } catch{
        return 0;
    }
}
// function to extract meter data from DB Buffer and structure the resulatant data.
export async function processData({DBBuffer, DBNumber, meterSize, meterCount, gatewayCount}) {
    
    const result = {
        STATUS: false,
        DATA: null
    };
    if(!DBBuffer){
        console.error("Error: DBBuffer is UNDEFINED in processDATA");
        return result;
    }
    if(!meterCount || !Number.isInteger(meterCount) || meterCount <= 0){
        console.error('Error in processing DB data: meterNames must be a positive integer.');
        return result;
    }  
    if(!gatewayCount || !Number.isInteger(gatewayCount) || gatewayCount <= 0){
        console.error('Error in processing DB data: gatewayCount must be a positive integer.');
        return result;
    } 
    if(!DBNumber || !Number.isInteger(DBNumber) || DBNumber <= 0){
        console.error('Error in processing DB data: DBNumber must be a positive integer:', DBNumber );
        return result;
    }   

    let DBName = "DB" + String(DBNumber);
    const tableNames = [];
    for(let i = 1; i <= gatewayCount; i++){
        for(let k = 1; k <= meterCount; k++){
            const tableName = `${DBName}G${i}M${k}`;
            tableNames.push(tableName);
        }
    }
    const tableCount = tableNames.length;
    const allowedTables = new Set(tableNames);
 
    try{
 
        const buf = DBBuffer;
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
        console.error('Error in processData:', err.message);
        result.STATUS = false;
        result.DATA = null;
        result.error = err;
        return result;
    }
}