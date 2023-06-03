import { ApexOptions } from "apexcharts";
import React from "react";
import Chart from "react-apexcharts";

type nbStationParCommune = {
    nom_arrondissement_communes: string,
    nb_station: number
}

async function getRepartitionStationParCommune() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/stats?type=nbstationparcommune`, { next: { revalidate: 120 } })
    const data: any = await res.json()
    return data
}

function RepartitionStationParCommuneOptions(data: nbStationParCommune[]): ApexOptions {
    // bar chart x : nom_arrondissement_communes, y : nb_station
    // title : Répartition des stations par commune
    // xaxis : nom_arrondissement_communes
    // yaxis : nb_station
    // log scale

    return {
        chart: {
            id: "repartitionStationParCommune",
            toolbar: {
                show: false
            }
        },
        xaxis: {
            categories: data.map((d) => d.nom_arrondissement_communes),
            labels: {
                show: false
            }
        },
        yaxis: {
            logarithmic: true,
            labels: {
                show: false
            }
        },
        title: {
            text: "Répartition des stations par commune",
            align: "center",
            style: {
                fontSize: '15px',
                fontWeight: 'bold',
                fontFamily: undefined,
                color: '#263238'
            },
        },
        tooltip: {
            enabled: true,
            y: {
                formatter: function (val) {
                    return val + " stations"
                }
            }
        },
        plotOptions: {
            bar: {
                horizontal: true,
                dataLabels: {
                    position: 'top',
                },
            }
        },
        dataLabels: {
            enabled: true,
            offsetX: -6,
            style: {
                fontSize: '12px',
                colors: ['#fff']
            }
        },
        stroke: {
            show: true,
            width: 1,
            colors: ['#fff']
        },
        fill: {
            opacity: 1
        },
        legend: {
            show: false
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
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
                y: d.nb_station,
            })) as { x: string, y: number }[]
        }
    ];


}

export default function AnalyseAccueil() {
    const [nbStationParCommune, setNbStationParCommune] = React.useState<nbStationParCommune[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        getRepartitionStationParCommune().then((data) => {
            if (!data) return
            setNbStationParCommune(data)
            setLoading(false)
        })
    }, [])

    return <>
        <Chart
            options={RepartitionStationParCommuneOptions(nbStationParCommune)}
            series={RepartitionStationParCommuneSeries(nbStationParCommune)}
            type="line"
            width="100%"
            height="400px"
            padding={{ left: 50, top: 10, right: 50, bottom: 10 }}
        />
    </>
}