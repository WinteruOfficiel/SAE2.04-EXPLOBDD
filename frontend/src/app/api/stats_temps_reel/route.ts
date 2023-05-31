import 'server-only';

import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "../../../../lib/db";
import { number, z } from 'zod';


export async function GET(request: NextRequest) {
    console.log(request.nextUrl.searchParams.get("type"));

    let type = request.nextUrl.searchParams.get("type");
    let n: number;

    // parse n to number
    try {
        n = parseInt( request.nextUrl.searchParams.get("n") == null ? "10" : request.nextUrl.searchParams.get("n") as string);
    } catch (e) {
        return new Response('Error 401', { status: 401 });
    }

    let queryType: { query: string, verifyFunction: z.ZodType<any, any>, oneValue: boolean } | null = null

    let whereDateClause = "s.date = ( \
        SELECT MAX(date) \
        FROM station_status \
        WHERE stationcode = i.stationcode \
      )";

    switch (type) {
        case "stationplusremplie":
            queryType = {
                "query": "SELECT i.stationcode, i.name, (s.numbikesavailable / i.capacity) as remplissage \
                FROM station_information i \
                INNER JOIN station_status s ON i.stationcode = s.stationcode \
                WHERE " + whereDateClause + " AND i.capacity > 0 \
                ORDER BY remplissage DESC",
                "verifyFunction": z.array(z.object({
                    "stationcode": z.string(),
                    "name": z.string(),
                    "remplissage": z.string().transform(parseFloat)
                })),
                "oneValue": false
            }
            break;
        case "stationmoinsremplie":
            queryType = {
                "query": "SELECT i.stationcode, i.name, (s.numbikesavailable / i.capacity) as remplissage \
                FROM station_information i \
                INNER JOIN station_status s ON i.stationcode = s.stationcode \
                WHERE " + whereDateClause + " AND i.capacity > 0 \
                ORDER BY remplissage ASC",
                "verifyFunction": z.array(z.object({
                    "stationcode": z.string(),
                    "name": z.string(),
                    "remplissage": z.string().transform(parseFloat)
                })),
                "oneValue": false
            }
            break;
        default:
            return new Response('Error 401', { status: 401 });
    }

    console.log(queryType);

    queryType.query += ` LIMIT ${n}`;

    let data: any = await executeQuery(queryType.query);

    console.log(data);

    // use zod to validate data
    try {
        // if the queryType is not supposed to return only one value, we take the first value of the array
        if (queryType.oneValue) {
            if (Array.isArray(data)) {
                data = data[0];
            }
        }


        const parsedData = queryType.verifyFunction.parse(data);

        return NextResponse.json(parsedData);

    } catch (e: any) {
        console.log(e.issues[0]);
        
        return new Response('Error 500', { status: 500 });
    }
}