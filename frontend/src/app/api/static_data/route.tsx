import 'server-only';

import mariadb from 'mariadb';
import { NextResponse } from 'next/server';

export async function GET() {
    const pool = mariadb.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE_NAME,
        connectionLimit: 5
    });

    console.log('pool: ', process.env.DB_HOST);
    console.log('pool: ', process.env.DB_USER);
    
    console.log('pool: ', pool);

    let conn;
    try {
        conn = await pool.getConnection();

        const rowsData = await conn.query('SELECT 1 + 1 AS solution');
        console.log('row data: ',rowsData);
        return NextResponse.json(rowsData);
    } catch (err) {
        console.log('error here : ', err);
        throw err;
    } finally {
        if (conn) {
            conn.release(); //release to pool
        }
    }
}