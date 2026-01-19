import pool from '../../config/db.js';


const tableNames = [];
const meterNames = [];
const DBNames = ["DB5", "DB8", "DB17", "DB24", "DB27", "DB30", "DB33", "DB36", "DB39",]
function buildMetername(){
    for(let i = 1; i <= 6; i++){
        for(let k = 1; k <= 12; k++){
            let meterName = `G${i}M${k}`;
            meterNames.push(meterName)
        }
    }
}

buildMetername();

async function deleteTable(DBNames, meterNames){
    for(let DBName of DBNames){
        for(let meterName of meterNames){
            const tableName = `${DBName}${meterName}`;
            tableNames.push(tableName)

            await pool.query(`
                DROP TABLE ${tableName}`)
        }
    }
}

await deleteTable(["DB30"], meterNames)
console.log(tableNames.length);
console.log(tableNames);