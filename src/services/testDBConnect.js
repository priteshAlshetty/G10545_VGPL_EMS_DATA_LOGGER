import { pool } from '../config/db.config.js';

export async function testDBConnect(retries = 10, delayMs = 5000){

    for(let attemp = 1; attemp <= retries; attemp++){
        try{
            const result = await pool.query('SELECT NOW()');
            //console.log('PostgreSQL Connected at:', result.rows[0].now);
            return true;
        } catch(err){
            console.error(
                `DB Connect attemp ${attemp} failed:`, err.message
            );
            if(attemp === retries){
                process.exit(1)
            }
            await new Promise(res => setTimeout(res, delayMs))
        }
    }
}
