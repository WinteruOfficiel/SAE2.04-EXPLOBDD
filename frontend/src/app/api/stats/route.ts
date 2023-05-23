import 'server-only';

import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "../../../../lib/db";
import { z } from 'zod';


export async function GET(request: NextRequest) {
    console.log(request.nextUrl.searchParams.get("type"));

    let type = request.nextUrl.searchParams.get("type");
    let perDay = request.nextUrl.searchParams.get("perDay") == null ? false : request.nextUrl.searchParams.get("perDay");
    let startDate = request.nextUrl.searchParams.get("startDate");
    let endDate = request.nextUrl.searchParams.get("endDate");

    // parse startDate and endDate to date
    const startDateParsed = startDate == null ? null : new Date(startDate);
    const endDateParsed = endDate == null ? null : new Date(endDate);

    // parse perDay to boolean
    perDay = perDay == "true" ? true : false;

    let queryType: { query: string, verifyFunction: z.ZodType<any, any>, oneValue: boolean } | null = null

    let whereDateClause = "";

    if (startDateParsed != null && endDateParsed == null) {
        whereDateClause = `date >= '${startDateParsed.toISOString()}'`;
    } else if (startDateParsed == null && endDateParsed != null) {
        whereDateClause = `date <= '${endDateParsed.toISOString()}'`;
    } else if (startDateParsed != null && endDateParsed != null) {
        whereDateClause = `date BETWEEN '${startDateParsed.toISOString()}' AND '${endDateParsed.toISOString()}'`;
    }

    if (perDay) {
        switch (type) {
            case "pourcentageEbike":
                queryType = {
                    "query": `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS jour, ((SUM(ebike)/SUM(numbikesavailable)) * 100) as value FROM station_status ${whereDateClause == "" ? "" : "WHERE"} ${whereDateClause} GROUP BY DATE(date);`,
                    "verifyFunction": z.array(z.object({
                        "jour": z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                        "value": z.string()
                    })),
                    "oneValue": true
                }
                break;
            default:
                return new Response('Error 401', { status: 401 });
        }
    } else {
        switch (type) {
            case "pourcentageEbike":
                queryType = {
                    "query": "SELECT ((SUM(ebike)/SUM(numbikesavailable)) * 100) as value FROM station_status",
                    "verifyFunction": z.object({
                        "value": z.string()
                    }),
                    "oneValue": false
                }
                break;
            default:
                return new Response('Error 401', { status: 401 });
        }
    }

    console.log(queryType);

    let data: any = await executeQuery(queryType.query);

    console.log(data);

    // use zod to validate data
    try {
        // if the queryType is not supposed to return only one value, we take the first value of the array
        if (!queryType.oneValue) {
            if (Array.isArray(data)) {
                data = data[0];
            }
        }


        const parsedData = queryType.verifyFunction.parse(data);

        return NextResponse.json(parsedData);

    } catch (e) {
        return new Response('Error 500', { status: 500 });
    }
}