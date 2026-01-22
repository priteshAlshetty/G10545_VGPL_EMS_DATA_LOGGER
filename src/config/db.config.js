import { Pool } from'pg';

export const pool = new Pool({
    user: 'postgres',
    password: "1234",
    database: 'vgpl_ems_datalogger',
    port: 5432,
    host: 'localhost',
    timezone: 'Asia/Kolkata'
})
