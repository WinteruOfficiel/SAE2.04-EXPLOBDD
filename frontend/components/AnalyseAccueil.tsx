import { ApexOptions } from "apexcharts";
import React from "react";
import Chart from "react-apexcharts";

import style from '../styles/charts.module.scss';
import Link from "next/link";

type nbStationParCommune = {
    nom_arrondissement_communes: string,
    nb_stations: number
}

async function getRepartitionStationParCommune() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/stats?type=nbstationparcommune`, { next: { revalidate: 120 } })
    const data: any = await res.json()
    return data
}

async function getStationPlus() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/stats?type=listestationplus`, { next: { revalidate: 120 } })
    const data: any = await res.json()
    return data
}

function RepartitionStationParCommuneOptions(data: nbStationParCommune[]): ApexOptions {
    // bar chart x: nom_arrondissement_communes, y: nb_stations
    // title: Répartition des stations par commune
    // xaxis: nom_arrondissement_communes
    // yaxis: nb_stations
    // log scale

    return {
        chart: {
            type: 'bar',
            background: '#f4f4f42f',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            }
        },
        plotOptions: {
            bar: {
                distributed: true,
            }
        },
        yaxis: {
            title: {
                text: "Nombre de stations"
            },
            logarithmic: true
        },
        dataLabels: {
            enabled: false
        },
        legend: {
            show: false
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: "vertical",
                shadeIntensity: 0.5,
                gradientToColors: undefined, // optional, if not defined - uses the shades of same color in series
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 50, 100],
            }
        },

    }
}

function RepartitionStationParCommuneSeries(data: nbStationParCommune[]): ApexAxisChartSeries {
    // x = nom_arrondissement_communes
    // y = nb_station
    return [
        {
            name: "Nombre de stations",
            data: data.map((d) => ({
                x: d.nom_arrondissement_communes,
                y: d.nb_stations,
            })) as { x: string, y: number }[]
        }
    ];


}

export default function AnalyseAccueil() {
    const [nbStationParCommune, setNbStationParCommune] = React.useState<nbStationParCommune[]>([])
    const [stationplus, setStationplus] = React.useState<{ name: string, stationcode: string }[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        getRepartitionStationParCommune().then((data) => {
            if (!data) return
            setNbStationParCommune(data.sort((a: any, b: any) => b.nb_stations - a.nb_stations))
        })

        getStationPlus().then((data) => {
            if (!data) return
            setStationplus(data)
        }
        )
    }, [])

    return <>
        <div className={style.XScrollableDiv}>
            <Chart
                options={RepartitionStationParCommuneOptions(nbStationParCommune)}
                series={RepartitionStationParCommuneSeries(nbStationParCommune)}
                type="bar"
                width="500%"
                height="400px"
            />
        </div>
        <h2>Liste stations+</h2>
        <h3>Certaines stations posséde des cadenas supplémentaires sur les bornes, ce qui permet d'augmenter le nombre de vélos disponibles. Certaines stations ont donc plus de vélos disponibles que de capacité maximale.</h3>
        <ul className={style.liste}>
            {stationplus.map((station) => <li style={{ width: '25%' }}><Link href={"/station/" + station.stationcode}>{station.name}</Link>
            </li>)}
        </ul>
    </>
}