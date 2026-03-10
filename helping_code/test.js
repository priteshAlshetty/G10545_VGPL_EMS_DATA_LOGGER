import fs from 'fs';
import pool from './db.js'




//import pool from '../../config/db.js';


const tableNames = [];
const meterNames = [];
const DBNames = ["DB5", "DB8", "DB17", "DB24", "DB27", "DB30", "DB33", "DB36", "DB39"];

function buildMetername(){
    for(let i = 1; i <= 6; i++){
        for(let k = 1; k <= 12; k++){
            let meterName = `G${i}M${k}`;
            meterNames.push(meterName)
        }
    }
}

buildMetername();

//console.log(meterNames.length);
//console.log(meterNames);

async function createTable(DBNames, meterNames, tableNames){
    try{
        for(const DBName of DBNames){
            for(const meterName of meterNames){
                const tableName = `${DBName}${meterName}`;
                tableNames.push(tableName);

                let sql = await pool.query(`
                    CREATE TABLE IF NOT EXISTS ${tableName} (
                    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                    Active_Energy NUMERIC(20, 4),
                    Reactive_Power NUMERIC(10, 4),
                    Apparent_Power NUMERIC(10, 4),
                    Current_I1 NUMERIC(10, 4),
                    Current_I2 NUMERIC(10, 4),
                    Current_I3 NUMERIC(10, 4),
                    Voltage_V1 NUMERIC(10, 4),
                    Voltage_V2 NUMERIC(10, 4),
                    Voltage_V3 NUMERIC(10, 4),
                    Active_Power NUMERIC(10, 4),
                    Frequency NUMERIC(10, 4),
                    Power_Factor NUMERIC(10, 4),
                    KW_Demand NUMERIC(10, 4),
                    THD_IL NUMERIC(10, 4),
                    THD_V NUMERIC(10, 4),
                    Spare1 NUMERIC(10, 4),
                    Spare2 NUMERIC(10, 4),
                    Spare3 NUMERIC(10, 4),
                    date_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    );
                `);

                console.log(`Table created, table name: ${tableName}`);
            }
        }
    } catch(err){
        console.log('Table Creation Error:', err);
    }
}


//for(let)
await createTable(DBNames, meterNames, tableNames);

// console.log(tableNames.length);
// console.log(tableNames);



//read meters name from json file
// const file = fs.readFileSync('meterNames.json', 'utf8');
// const jsonData = JSON.parse(file);
// const meters = jsonData.meters; //array of meters' name
// //console.log(meters);

async function clearMeterEntries(tableNames){
    for(const meter of tableNames){
        
        try{
            const result = await pool.query(`
                TRUNCATE TABLE ${meter}`);

            console.log(result.rows);
        } catch(err){
            console.error(err.message)
        }
        
    }
}

//await clearMeterEntries(tableNames);