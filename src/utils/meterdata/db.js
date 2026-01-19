import { Pool } from'pg';
import dotenv from 'dotenv'
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || 'vishakha',
    port: process.env.DB_PORT || 5432,
    host: process.env.DB_HOST || 'localhost',
    timezone: "Asia/Kolkata"

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