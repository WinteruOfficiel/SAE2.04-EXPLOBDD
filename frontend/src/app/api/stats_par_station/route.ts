import 'server-only';

import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "../../../../lib/db";
import { z } from 'zod';


export async function GET(request: NextRequest) {
    console.log(request.nextUrl.searchParams.get("type"));

    let type = request.nextUrl.searchParams.get("type");
    let stationcode = request.nextUrl.searchParams.get("stationcode");
    let startDate = request.nextUrl.searchParams.get("startDate");
    let endDate = request.nextUrl.searchParams.get("endDate");

    if (stationcode == null || type == null) {
        return new Response('Error 401', { status: 401 });
    }


    let queryType: { query: string, verifyFunction: z.ZodType<any, any>, oneValue: boolean } | null = null

    let whereDateClause = "";

    if (startDate != null && endDate == null) {
        whereDateClause = `convert_tz(date, '+00:00', 'Europe/Paris') >= '${startDate} 00:00:00'`;
    } else if (startDate == null && endDate != null) {
        whereDateClause = `convert_tz(date, '+00:00', 'Europe/Paris') <= '${endDate} 23:59:59'`;
    } else if (startDate != null && endDate != null) {
        whereDateClause = `convert_tz(date, '+00:00', 'Europe/Paris') BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59'`;
    }


    switch (type) {
        case "aujourdhui":
            queryType = {
                // date                | stationcode | is_installed | numdocksavailable | numbikesavailable | mechanical | ebike
                "query": `SELECT convert_tz(date, '+00:00', 'Europe/Paris') as utcdate, stationcode, is_installed, numdocksavailable, numbikesavailable, mechanical, ebike 
                FROM station_status WHERE stationcode = ${stationcode} ${whereDateClause == "" ? "": "AND"} ${whereDateClause}`,
                "verifyFunction": z.array(z.object({
                    // date ex : 2023-06-02 11:06:27 UTC => convertir en temps local
                    "utcdate": z.date(),
                    "stationcode": z.string().regex(RegExp(`^${stationcode}$`)),
                    "is_installed": z.string(),
                    "numdocksavailable": z.number(),
                    "numbikesavailable": z.number(),
                    "mechanical": z.number(),
                    "ebike": z.number()
                })),
                "oneValue": false
            }
            break;
        default:
            return new Response('Error 401', { status: 401 });
    }

    console.log(queryType.query);

    let data: any = await executeQuery(queryType.query);

    console.log(data[0]);

    // use zod to validate data
    try {
        const parsedData = queryType.verifyFunction.parse(data);


        return NextResponse.json(parsedData);

    } catch (e: any) {
        console.log(e.issues[0]);
        return new Response('Error 500', { status: 500 });
    }
}