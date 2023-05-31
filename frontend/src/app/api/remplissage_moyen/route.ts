import 'server-only';

import type { VelibDataMoyenne  } from '../../../../types/velib_data';

import { executeQuery } from '../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';


export async function GET(request: NextRequest) {
    let hour = request.nextUrl.searchParams.get("hour");
    let startDate = request.nextUrl.searchParams.get("startDate");
    let endDate = request.nextUrl.searchParams.get("endDate");

    if (isNaN(Number(hour))) {
        return new Response('Error 401', { status: 401 });
    }

    let query = `SELECT \
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
        si.stationcode, si.name`

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

function getWhereClause(startDate: string | null, endDate: string | null, hour: string | null) {
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
}