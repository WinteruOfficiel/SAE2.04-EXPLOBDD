import 'server-only';


import { executeQuery } from '../../../../lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';


export async function GET() {
    let data = await executeQuery('SELECT DISTINCT nom_arrondissement_communes FROM station_information');
    // use zod to validate data
    try {
        const parsedData: { nom_arrondissement_communes: string }[] = z.array(z.object({ nom_arrondissement_communes: z.string() })).parse(data);

        return NextResponse.json(parsedData.map((e) => e.nom_arrondissement_communes));

    } catch (e) {
        // console.log(e);
        return new Response('Error', { status: 500 });
    }
}