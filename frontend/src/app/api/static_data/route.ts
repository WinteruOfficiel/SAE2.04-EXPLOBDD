import 'server-only';

import type { VelibStationInformation } from '../../../../types/velib_data';

import { executeQuery } from '../../../../lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';


export async function GET() {
    let data = await executeQuery('SELECT * FROM station_information');

    // use zod to validate data
    try {
        const parsedData: VelibStationInformation[] = z.array(z.object({
            stationcode: z.string(),
            name: z.string(),
            capacity: z.number(),
            coordonnees_geo: z.object({
                x: z.number(),
                y: z.number()
            }),
            nom_arrondissement_communes: z.string()
        })).parse(data);


        return NextResponse.json(parsedData);

    } catch (e) {
        return new Response('Error', { status: 500 });
    }
}