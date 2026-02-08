import { pool } from '../config/db.config.js';

export async function testDBConnect(retries = 10, delayMs = 5000){

    for(let attemp = 1; attemp <= retries; attemp++){
        try{

            const result = await pool.query('SELECT 1');
            return true;

        } catch(err){

            if(attemp === retries){
                console.error('PostgreSQL Database not connected...!')
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, delayMs))
        }
    }
}
