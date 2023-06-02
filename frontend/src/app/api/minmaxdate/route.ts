import 'server-only';

import type { VelibStationInformation } from '../../../../types/velib_data';

import { executeQuery } from '../../../../lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';


export async function GET() {
    let data = await executeQuery('SELECT DATE(MIN(Date)) as min, DATE(MAX(DATE)) as max FROM station_status');

    // use zod to validate data
    try {
        // check if data has length a length value (ts)
        if ((data as any)?.length === 0) {
            return new Response('Error', { status: 500 });
        }

        console.log(data)
        

        data = (data as any)[0];

        console.log(data)

        const parsedData = z.object({
            // date to "yyyy-mm-dd"
            min: z.date().transform((date) => date.toISOString().split('T')[0]),
            max: z.date().transform((date) => date.toISOString().split('T')[0]),
        }).parse(data);


        return NextResponse.json(parsedData);

    } catch (e) {
        return new Response('Error', { status: 500 });
    }
}