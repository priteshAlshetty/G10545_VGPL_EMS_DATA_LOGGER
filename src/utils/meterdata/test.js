//import fs from 'fs';

import { table } from 'console';
import pool from '../../config/db.js';
import fs from 'fs';

//const tableNames = [];
//const meterNames = [];
const DBNames = ["DB5", "DB8", "DB17", "DB24", "DB27", "DB30", "DB33", "DB36", "DB39"]
function buildMetername(){
    for(let i = 1; i <= 6; i++){
        for(let k = 1; k <= 12; k++){
            let meterName = `G${i}M${k}`;
            meterNames.push(meterName)
        }
    }
}
//buildMetername();
//console.log(meterNames.length);

async function deleteTable(DBNames, meterNames, tableNames){
    for(let DBName of DBNames){
        for(let meterName of meterNames){
            const tableName = `${DBName}${meterName}`;
            tableNames.push(tableName);
        }
    }
    fs.writeFileSync('tableNames.json', JSON.stringify(tableNames, null, 2));
    console.log('JSON file created.');
}
//await deleteTable(DBNames, meterNames, tableNames)
//console.log(tableNames.length);
//console.log(tableNames);



async function insert() {
    const sql = `
        INSERT INTO DB5G1M1 (
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

    await pool.query(sql, [
        111.1111,      // Active_Energy
        22.22,         // Reactive_Power
        3.33333333,    // Apparent_Power
        4.232323232,   // Current_I1
        0.12,          // Current_I2
        0.4324324253,  // Current_I3
        10.0,          // Voltage_V1
        12.1211,       // Voltage_V2
        0.898,         // Voltage_V3
        543.454,       // Active_Power
        676.545,       // Frequency
        0.89,          // Power_Factor
        121,           // KW_Demand
        1,             // THD_IL
        5.5,           // THD_V
        34.3434343,    // Spare1
        56,            // Spare2
        332             // Spare3
    ]);
}
//await insert();

        const DBNumber = 12;
        let DBName = "DB" + String(DBNumber);
        const tableNames = [];
        for(let i = 1; i <= 6; i++){
            for(let k = 1; k <= 12; k++){
                const tableName = `${DBName}G${i}M${k}`;
                tableNames.push(tableName);
            }
        }
        //console.log(tableNames.length);
        //console.log(tableNames);

const jsonData = fs.readFileSync('./meterdata/tableNames.json', 'utf8');
const meterNames = JSON.parse(jsonData, null, 2);
//console.log(meterNames);
//console.log(meterNames.length);

async function deleteEntries(tableNames) {
    for(const table of tableNames){
        await pool.query(`
            DELETE FROM ${table};
        `);
        
        console.log(`Entries deleted: ${table}`);
    }
    
}

await deleteEntries(meterNames);