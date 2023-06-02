
import mysql from 'mysql2/promise';
import { NextResponse } from 'next/server';


let pool: mysql.Pool | null = null;
let conn: mysql.Connection | null = null;

export function getPoll(): mysql.Pool {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE_NAME,
            port: 3306,
            connectionLimit: 5
        });
    }

    return pool;
}

export async function getConn() {
    if (!conn) {
        console.log('Creating new connection to ' + process.env.DB_HOST);
        conn = await getPoll().getConnection();
    }

    return conn;
}

export async function endConn() {
    if (conn) {
        await (await getConn()).end();
        conn = null;
    }
}

export async function executeQuery(query: string, params: any[] = []) {
    const conn = await getConn();
    try {
        const [rows] = await conn.execute(query, params);
        return rows;
    } catch (e) {
        throw e;
    }
}