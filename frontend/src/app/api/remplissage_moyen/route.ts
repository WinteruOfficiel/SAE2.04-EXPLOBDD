import 'server-only';

import type { VelibDataMoyenne } from '../../../../types/velib_data';

import { executeQuery } from '../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';


export async function GET(request: NextRequest) {
    let hour = request.nextUrl.searchParams.get("hour");
    let startDate = request.nextUrl.searchParams.get("startDate");
    let endDate = request.nextUrl.searchParams.get("endDate");

    let commune = request.nextUrl.searchParams.get("commune");

    if (commune != null && (commune == "all" || commune == "")) {
        commune = null;
    }

    if (isNaN(Number(hour))) {
        return new Response('Error 401', { status: 401 });
    }

    /*     let query = `SELECT \
        si.*, \
        AVG(ss.numbikesavailable / si.capacity) AS remplissage_moyen, \
        AVG(ss.numdocksavailable) AS docks_disponibles, \
        AVG(ss.numbikesavailable) AS velos_disponibles, \
        AVG(ss.mechanical) AS velos_mecaniques_disponibles, \
        AVG(ss.ebike) AS velos_electriques_disponibles \
            FROM \
            station_status AS ss \
            INNER JOIN \
            station_information AS si ON ss.stationcode = si.stationcode \
            ${getWhereClause(startDate, endDate, hour)} \
            GROUP BY \
            si.stationcode, si.name` */

    let query = `SELECT \
    si.*, \
    COALESCE((SELECT AVG(numbikesavailable / capacity) FROM station_status WHERE ${getWhereClause(startDate, endDate, hour)}), -1) AS remplissage_moyen, \
    COALESCE((SELECT AVG(numdocksavailable) FROM station_status WHERE ${getWhereClause(startDate, endDate, hour)}), -1) AS docks_disponibles, \
    COALESCE((SELECT AVG(numbikesavailable) FROM station_status WHERE ${getWhereClause(startDate, endDate, hour)}), -1) AS velos_disponibles, \
    COALESCE((SELECT AVG(mechanical) FROM station_status WHERE ${getWhereClause(startDate, endDate, hour)}), -1) AS velos_mecaniques_disponibles, \
    COALESCE((SELECT AVG(ebike) FROM station_status WHERE ${getWhereClause(startDate, endDate, hour)}), -1) AS velos_electriques_disponibles \
    FROM \
    station_information AS si \
    WHERE \
    si.capacity > 0 ${commune != null ? "AND si.nom_arrondissement_communes = '" + commune + "'" : ""}`

    let data = await executeQuery(query);

    console.log(query);

    // zod permet de valider les données. si jamais les données n'ont pas le bon format, on renvoie une erreur 500.
    try {
        const parsedData: VelibDataMoyenne[] = z.array(z.object({
            stationcode: z.string(),
            name: z.string(),
            capacity: z.number(),
            coordonnees_geo: z.object({
                x: z.number(),
                y: z.number()
            }),
            nom_arrondissement_communes: z.string(),
            remplissage_moyen: z.string().transform((x) => (Number(x) * 100)),
            docks_disponibles: z.string().transform((x) => (Number(x))),
            velos_disponibles: z.string().transform((x) => (Number(x))),
            velos_mecaniques_disponibles: z.string().transform((x) => (Number(x))),
            velos_electriques_disponibles: z.string().transform((x) => (Number(x))),
        })).parse(data);

        return NextResponse.json(parsedData);

    } catch (e: any) {
        console.log(e.issues[0]);
        console.log(e.issues[0].path);
        return new Response('Error', { status: 500 });
    }
}

/* function getWhereClause(startDate: string | null, endDate: string | null, hour: string | null) {
    let whereClause = "WHERE si.capacity > 0";

    if (startDate) {
        whereClause += ` AND ss.date >= '${startDate} 00:00:00'`;
    }

    if (endDate) {
        whereClause += ` AND ss.date <= '${endDate} 23:59:59'`;
    }

    if (hour) {
        whereClause += ` AND HOUR(ss.date) = ${hour}`;
    }

    return whereClause;
} */

function getWhereClause(startDate: string | null, endDate: string | null, hour: string | null) {
    let whereClause = "stationcode = si.stationcode"

    if (startDate) {
        whereClause += ` AND date >= '${startDate} 00:00:00'`;
    }

    if (endDate) {
        whereClause += ` AND date <= '${endDate} 23:59:59'`;
    }

    if (hour) {
        whereClause += ` AND HOUR(date) = ${hour}`;
    }

    return whereClause;
}