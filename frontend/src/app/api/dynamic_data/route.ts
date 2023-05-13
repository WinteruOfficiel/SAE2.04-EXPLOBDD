import 'server-only';

import type { VelibStationInformation } from '../../../../types/velib_data';

import { executeQuery } from '../../../../lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';


export async function GET() {
    let data = await executeQuery('SELECT i.*, s.* \
    FROM station_information i \
    INNER JOIN station_status s ON s.stationcode = i.stationcode \
    WHERE s.date = ( \
      SELECT MAX(date) \
      FROM station_status \
      WHERE stationcode = i.stationcode \
    )');

    // zod permet de valider les données. si jamais les données n'ont pas le bon format, on renvoie une erreur 500.
    try {
        const parsedData: VelibStationInformation[] = z.array(z.object({
            stationcode: z.string(),
            name: z.string(),
            capacity: z.number(),
            coordonnees_geo: z.object({
                x: z.number(),
                y: z.number()
            }),
            nom_arrondissement_communes: z.string(),
            date: z.date(),
            is_installed: z.string(),
            numdocksavailable: z.number(),
            numbikesavailable: z.number(),
            mechanical: z.number(),
            ebike: z.number(),
        })).parse(data);

        return NextResponse.json(parsedData);

    } catch (e) {
        return new Response('Error', { status: 500 });
    }
}