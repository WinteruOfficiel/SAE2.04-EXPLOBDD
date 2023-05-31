'use client';

import { ApexOptions } from "apexcharts";
import React from "react";
import Chart from "react-apexcharts";

import style from "../styles/charts.module.scss";
import { StationRemplieStat } from "../types/velib_data";

async function getStat(stat: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/stats_temps_reel?type=${stat}`, { next: { revalidate: 120 } })
    const data: any = await res.json()
    // try parse int
    try {
        return data
    } catch (error) {
        console.error(error)
        return 0
    }
}


export default function AnalyseTempsReel() {
    const [stationPlusRemplie, setStationPlusRemplie] = React.useState<StationRemplieStat[]>([])
    const [stationMoinReplie, setStationMoinReplie] = React.useState<StationRemplieStat[]>([])
    const [isLoading, setIsLoading] = React.useState<boolean>(true)

    React.useEffect(() => {
        const fetchData = async () => {
            const [stationPlusRemplie, stationMoinReplie] = await Promise.all([getStat("stationplusremplie"), getStat("stationmoinsremplie")]);

            if (!stationPlusRemplie) return

            setStationPlusRemplie(stationPlusRemplie as StationRemplieStat[])
            setStationMoinReplie(stationMoinReplie as StationRemplieStat[])

            setIsLoading(false)
        };

        fetchData();
    }, [])

    return (
        <>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <div id={style.chartContainer}>
                    <h2>Station les plus remplie</h2>
                    <ul>
                        {stationPlusRemplie.map((station, index) => (
                            <li key={index}>
                                <p>{station.name}</p>
                                <p>{Math.round(station.remplissage*100)}%</p>
                            </li>
                        ))}
                    </ul>
                    <h2>Station les moins remplie</h2>
                    <ul>
                        {stationMoinReplie.map((station, index) => (
                            <li key={index}>
                                <p>{station.name}</p>
                                <p>{Math.round(station.remplissage*100)}%</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
