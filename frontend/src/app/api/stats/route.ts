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
    let commune = request.nextUrl.searchParams.get("commune");

    if (commune != null && (commune == "all" || commune == "")) {
        commune = null;
    }

    let heure = request.nextUrl.searchParams.get("heure") || "22";

    if (type == null) {
        return new Response('Error 401', { status: 401 });
    }

    console.log(startDate, endDate);

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

            case "deplacementpertinent":
                queryType = {
                    query: `WITH cte_station_status_22h AS (
                        SELECT 
                            ss.stationcode,
                            si.name,
                            si.coordonnees_geo,
                            AVG(ss.numbikesavailable / si.capacity) AS remplissage_moyen
                        FROM
                            station_status AS ss
                        INNER JOIN
                            station_information AS si ON ss.stationcode = si.stationcode
                        WHERE
                            HOUR(ss.date) = ${heure} AND si.capacity > 0 ${commune != null ? `AND si.nom_arrondissement_communes = '${commune}'` : ""}
                        GROUP BY
                             si.stationcode, si.name
                    ),
                    cte_station_vide AS (
                        SELECT stationcode, name, remplissage_moyen, coordonnees_geo
                        FROM cte_station_status_22h
                        WHERE remplissage_moyen < 0.1
                    ),
                    cte_station_proche AS (
                        SELECT
                            stv.stationcode,
                            stv.name,
                            stv.remplissage_moyen,
                            sp.stationcode AS station_pleine,
                            sp.name AS station_pleine_name,
                            sp.remplissage_moyen AS remplissage_station_pleine,
                            ST_Distance_Sphere(stv.coordonnees_geo, sp.coordonnees_geo) AS distance,
                            ROW_NUMBER() OVER (PARTITION BY stv.stationcode, stv.name ORDER BY ST_Distance_Sphere(stv.coordonnees_geo, sp.coordonnees_geo)) AS row_num    FROM
                            cte_station_vide AS stv
                        LEFT JOIN cte_station_status_22h AS sp ON sp.remplissage_moyen >= 0.8
                    )
                    SELECT
                        stationcode,
                        name,
                        remplissage_moyen,
                        station_pleine,
                        station_pleine_name,
                        remplissage_station_pleine,
                        distance
                    FROM
                        cte_station_proche
                    WHERE
                        row_num = 1;`,
                    "verifyFunction": z.array(z.object({
                        "stationcode": z.string(),
                        "name": z.string(),
                        "remplissage_moyen": z.string(),
                        "station_pleine": z.string(),
                        "station_pleine_name": z.string(),
                        "remplissage_station_pleine": z.string(),
                        "distance": z.number()
                    })),
                    "oneValue": true
                }
                break;
            case "sommeflux":
                queryType = {
                    query: `SELECT st.date, SUM(st.numbikesavailable) as sumbikesavailable, SUM(st.numdocksavailable) as sumdocksavailable, SUM(st.ebike) as sumebike, SUM(st.mechanical) as summechanical  FROM station_status st ${commune != null ? "INNER JOIN station_information si ON si.stationcode = st.stationcode" : ""} ${(whereDateClause == "" && commune == null) ? "" : "WHERE"} ${whereDateClause} ${(whereDateClause != "" && commune != null) ? "AND" : ""} ${commune != null ? "si.nom_arrondissement_communes = '" + commune + "'" : ""} GROUP BY date;`,
                    "verifyFunction": z.array(z.object({
                        "date": z.date(),
                        "sumbikesavailable": z.string(),
                        "sumdocksavailable": z.string(),
                        "sumebike": z.string(),
                        "summechanical": z.string()
                    })),
                    "oneValue": true
                }
                break;
            case "nbuser":
                queryType = {
                    query: `SELECT AVG(diff_velos_disponibles) AS moyenne_diff_velos_disponibles
                FROM(
                SELECT
                    date,
                    MAX(nb_velos_disponibles) - MIN(nb_velos_disponibles) AS diff_velos_disponibles
                FROM (SELECT
                    date,
                    SUM(numbikesavailable) AS nb_velos_disponibles
                FROM
                    station_status
                GROUP BY
                    date) as sub
                GROUP BY
                    DATE(date)) as sub2`,
                    "verifyFunction": z.object({
                        "moyenne_diff_velos_disponibles": z.string()
                    }),
                    "oneValue": false
                }
                break;
            case "nbstation":
                queryType = {
                    query: `SELECT COUNT(stationcode) AS nb_stations FROM station_information ${commune != null ? "WHERE nom_arrondissement_communes = '" + commune + "'" : ""}`,
                    "verifyFunction": z.object({
                        "nb_stations": z.number()
                    }),
                    "oneValue": false
                }
                break;
            case "nbstationparcommune":
                queryType = {
                    query: `SELECT nom_arrondissement_communes, COUNT(stationcode) AS nb_stations FROM station_information GROUP BY nom_arrondissement_communes`,
                    "verifyFunction": z.array(z.object({
                        "nom_arrondissement_communes": z.string(),
                        "nb_stations": z.number()
                    })),
                    "oneValue": false
                }
                break;
            default:
                return new Response('Error 401', { status: 401 });
        }
    }

    console.log(queryType.query);

    let data: any = await executeQuery(queryType.query);

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

    } catch (e: any) {
        console.log(e.issues[0]);
        return new Response('Error 500', { status: 500 });
    }
}