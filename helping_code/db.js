import { Pool } from'pg';
//import dotenv from 'dotenv'
//dotenv.config();

const pool = new Pool({
    user: 'postgres',
    password: "1234",
    database: 'vgpl_ems_datalogger',
    port:  5432,
    host: 'localhost'

})

pool.query('SELECT NOW()', (err, result) => {
    if(err){
        console.error('Database Connection error:', err)
    }

    else {
        console.log('Connected to PostgresSQL...!', result.rows[0].now);
    }

    
})

export default pool;