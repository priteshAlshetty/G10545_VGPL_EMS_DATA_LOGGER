
// function to read PLC DB and return buffer in response
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