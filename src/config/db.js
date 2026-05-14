import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Asegurar que lee .env de la raíz
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'confidencialidad',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

pool.getConnection()
    .then(conn => {
        console.log('Connect to MySQL confidencialidad db');
        conn.release();
    })
    .catch(err => {
        console.error('Error connecting to MySQL:', err);
    });
