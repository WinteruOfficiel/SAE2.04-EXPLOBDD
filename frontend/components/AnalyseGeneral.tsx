'use client';

import { ApexOptions } from "apexcharts";
import React from "react";
import Chart from "react-apexcharts";

import style from "../styles/charts.module.scss";
import formatDateFrench from "../lib/formatFrenchData";
import { deplacementPertinent, fluxTotalData } from "../types/velib_data";
import Link from "next/link";
import { ChartLoading } from "./Loading";

async function getPourcentageEbike(perDay: boolean = false) {
    // fetch : /api/stats?type=pourcentageEbike
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/stats?type=pourcentageEbike&perDay=${perDay}`, { next: { revalidate: 120 } })
    const data: any = await res.json()
    // try parse int
    try {
        if (perDay) {
            return data.map((data: any) => ({ jour: data.jour, value: Math.round(parseInt(data.value)) }))
        }
        return Math.round(parseInt(data.value))
    } catch (error) {
        console.error(error)
        return 0
    }
}

async function getDeplacementPertinent(commune: string) {
    commune = commune == null ? "" : commune
    commune = commune === "all" ? "" : commune
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/stats?type=deplacementpertinent&commune=${commune}`, { next: { revalidate: 120 } })
    const data: any = await res.json()
    return data
}

async function getNbParJour() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/stats?type=nbuser`, { next: { revalidate: 120 } })
    const data: any = await res.json()
    return data
}

async function getFluxTotal(startDate: string, endDate: string, commune: string) {
    commune = commune == null ? "" : commune
    commune = commune === "all" ? "" : commune
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/stats?type=sommeflux&startDate=${startDate}&endDate=${endDate}&commune=${commune}`, { next: { revalidate: 120 } })
    const data: any = await res.json()
    return data
}

function getPourcentageBikeTypeChart(pourcentageEbike: number): { series: number[], options: ApexOptions } {
    return {
        series: [pourcentageEbike, 100 - pourcentageEbike],
        options: {
            title: {
                text: "Pourcentage de vélo électrique et mécanique dans le réseau Vélib",
                align: "center",
                style: {
                    fontSize: '15px',
                    fontWeight: 'bold',
                    fontFamily: undefined,
                    color: '#263238'
                },
            },
            dataLabels: {
                enabled: true,
                formatter: function (val) {
                    return val + "%"
                }
            },
            tooltip: {
                enabled: true,
                y: {
                    formatter: function (val) {
                        return val + "%"
                    }
                }
            },
            chart: {
                type: 'donut',
                toolbar: {
                    show: true
                }
            },
            labels: ['Vélo électrique', 'Vélo mécanique'],
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
        },
    }
}

function getPourcentageBikeTypeChartPerDay(pourcentageEbike: { jour: string, value: number }[]): { series: ApexAxisChartSeries, options: ApexOptions } {
    // stacked bar chart
    return {
        series: [
            {
                name: "Vélo électrique",
                data: pourcentageEbike.map((data) => data.value)
            },
            {
                name: "Vélo mécanique",
                data: pourcentageEbike.map((data) => 100 - data.value)
            }
        ],
        options: {
            title: {
                text: "Pourcentage de vélo électrique et mécanique dans le réseau Vélib par jour",
                align: "center",
                style: {
                    fontSize: '20px',
                    fontWeight: 'bold',
                    fontFamily: undefined,
                    color: '#263238'
                },
            },
            chart: {
                type: 'bar',
                stacked: true,
                stackType: "100%",
                toolbar: {
                    show: true
                },
                zoom: {
                    enabled: true
                }
            },
            dataLabels: {
                enabled: true,
                style: {
                    fontSize: '10px',
                }
            },
            tooltip: {
                enabled: true,
                y: {
                    formatter: function (val) {
                        return val + "%"
                    }
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                },
            },
            xaxis: {
                type: 'datetime',
                categories: pourcentageEbike.map((data) => data.jour),
                labels: {
                    formatter: function (value, timestamp) {
                        if (timestamp === undefined) return "";

                        return formatDateFrench(new Date(timestamp))
                    }
                }
            },
            legend: {
                position: 'right',
                offsetY: 40
            },
            fill: {
                opacity: 1
            }
        },
    }
}

function fluxTotalChartOption(start_date: string, end_date: string, commune: string): ApexOptions {
    // line chart
    // xaxis : date
    // yaxis : nb vélos ou docks 

    let mindate = new Date(start_date)
    mindate.setHours(0, 0, 0, 0)
    let maxdate = new Date(end_date)
    maxdate.setHours(23, 59, 59, 999)

    commune = commune == null ? "" : commune
    commune = commune === "all" ? "" : commune


    return {
        title: {
            text: "Flux total de vélo et de docks dans le réseau Vélib" + (commune === "" ? "" : " à " + commune),
            align: "center",
            style: {
                fontSize: '20px',
                fontWeight: 'bold',
                fontFamily: undefined,
                color: '#263238'
            },
        },
        chart: {
            type: 'line',
            height: 350,
            background: '#f4f4f42f',
        },
        stroke: {
            width: [4, 4, 4],
            curve: 'smooth',
            fill: {
                type: ['gradient', 'gradient', 'gradient'],
                gradient: {
                    shade: 'light',
                    gradientToColors: ['#0000ff', '#ff0000', '#ffff00'],
                    shadeIntensity: 1,
                    type: 'horizontal',
                    opacityFrom: 0.7,
                    opacityTo: 1,
                    stops: [0, 100, 100, 100]
                },
            }
        },
        xaxis: {
            type: 'datetime',
            min: mindate.getTime(),
            max: maxdate.getTime(),
            labels: {
                formatter: function (value, timestamp) {
                    if (timestamp === undefined) return "";

                    return formatDateFrench(new Date(timestamp))
                }
            }
        },
        yaxis: {
            title: {
                text: 'Nombre de vélos ou de docks'
            },
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: function (y) {
                    if (typeof y !== "undefined") {
                        return y.toFixed(0) + " vélos"
                    }
                    return y;
                }
            },
            x: {
                formatter: function (x) {
                    if (typeof x !== "undefined") {
                        const date = new Date(x)
                        return formatDateFrench(date) + " " + date.toLocaleTimeString("fr-FR", { hour: "numeric", minute: "numeric" })
                    }
                    return x;
                }
            }
        },
        markers: {
            size: 0,
            hover: {
                sizeOffset: 6
            }
        }
    }
}

function fluxTotalChartSeries(today_data: fluxTotalData[]): ApexAxisChartSeries {
    // 3 courbes
    // de bas en haut Dock disponible, vélo, vélo électrique
    // en nombre pas en pourcentage
    // xaxis : date utc
    // yaxis : nombre de vélos ou de docks
    return [
        {
            name: "Dock disponible",
            data: today_data.map((data) => ({
                x: new Date(data.date).getTime(),
                y: data.sumdocksavailable
            }))
        },
        {
            name: "Vélo mécanique",
            data: today_data.map((data) => ({
                x: new Date(data.date).getTime(),
                y: data.summechanical
            }))
        },
        {
            name: "Vélo électrique",
            data: today_data.map((data) => ({
                x: new Date(data.date).getTime(),
                y: data.sumebike
            }))
        }
    ];
}


export default function AnalyseGeneral({ minmaxdate, selectedCommunes }: { minmaxdate: { min: string, max: string }, selectedCommunes: string }) {
    const [pourcentageEbike, setPourcentageEbike] = React.useState<number>(0)
    const [pourcentageEbikePerDay, setPourcentageEbikePerDay] = React.useState<{ jour: string, value: number }[]>([])
    const [deplacementpertinent, setDeplacementPertinent] = React.useState<deplacementPertinent[]>([])
    const [fluxTotal, setFluxTotal] = React.useState<fluxTotalData[]>([])
    const [nbUtilisateur, setNbUtilisateur] = React.useState<number>(-1);
    const [isLoading, setIsLoading] = React.useState<boolean>(true)
    const [fluxloading, setFluxLoading] = React.useState<boolean>(true)
    const [deplacementloading, setDeplacementLoading] = React.useState<boolean>(true)

    React.useEffect(() => {
        const fetchData = async () => {
            setDeplacementLoading(true)
            setIsLoading(true)
            const [totalData, perDayData, deplacementpertinent, nbuserapprox] = await Promise.all([getPourcentageEbike(), getPourcentageEbike(true), getDeplacementPertinent(selectedCommunes), getNbParJour()])

            if (!totalData || !perDayData || !deplacementpertinent || !nbuserapprox) return

            setPourcentageEbike(totalData)

            setPourcentageEbikePerDay(perDayData as { jour: string, value: number }[])

            setDeplacementPertinent(deplacementpertinent as deplacementPertinent[])

            setNbUtilisateur(nbuserapprox.moyenne_diff_velos_disponibles);

            setIsLoading(false)
            setDeplacementLoading(false)
        };

        fetchData();
    }, [])

    React.useEffect(() => {
        if (minmaxdate.min === "" || minmaxdate.max === "") return

        setFluxLoading(true)
        const fetchData = async () => {
            const data = await getFluxTotal(minmaxdate.min, minmaxdate.max, selectedCommunes)

            if (!data) return

            setFluxTotal(data)
            setFluxLoading(false)

        };

        fetchData();
    }, [minmaxdate, selectedCommunes])

    React.useEffect(() => {
        const fetchData = async () => {
            setDeplacementLoading(true)
            console.log("fetching deplacement pertinent")
            const data = await getDeplacementPertinent(selectedCommunes)

            if (!data) return

            setDeplacementPertinent(data);
            setDeplacementLoading(false)
        }
        fetchData()
    }, [selectedCommunes])

    const fluxChart = fluxloading ? (<ChartLoading />) : (
        fluxTotal && minmaxdate && minmaxdate.min !== "" && minmaxdate.max !== "" && (
            <Chart
                options={fluxTotalChartOption(minmaxdate.min, minmaxdate.max, selectedCommunes)}
                series={fluxTotalChartSeries(fluxTotal)}
                type="line"
                width="400%"
                height="400px"
            />
        ))


    React.useEffect(() => {
        console.log(getPourcentageBikeTypeChart(pourcentageEbike))
    }, [pourcentageEbike])

    return (
        <>
            {isLoading ? (
                <p><ChartLoading /></p>
            ) : (
                <div id={style.chartContainer}>
                    {fluxChart}
                    <h2>Estimations du nombre minimum d'usagers quotidiens</h2>
                    <h4 style={{ color: "#444444" }}>
                        <p>Si l'on prends le moment de la journée avec le plus de vélos disponibles (presque aucun vélo en circulation) et on y soustrait le moment de la journée avec le moins de vélos disponibles (presque aucun vélo en station), on obtient une estimation minimum du nombre d'usagers maximum par jour.</p>
                        <p>Si l'on fait la moyenne des valeurs quotidiennes, on obtient une estimation du nombre minimum d'usager quotidien de velib.</p>
                        <p>Il y'a donc minimum <strong>{nbUtilisateur > 0 ? Math.round(nbUtilisateur) : '...'}</strong> usagers de velib par jour.</p>
                        <p><strong>ATTENTION :</strong> Ce chiffre est un minimum et est probablement très en dessous de la réalité.</p>
                    </h4>

                    <div className={style.centerInDiv} style={{ width: "100%" }}>
                        <Chart
                            options={getPourcentageBikeTypeChart(pourcentageEbike).options}
                            series={getPourcentageBikeTypeChart(pourcentageEbike).series}
                            type="donut"
                            width={"200%"}
                        />
                    </div>


                    <Chart
                        options={getPourcentageBikeTypeChartPerDay(pourcentageEbikePerDay).options}
                        series={getPourcentageBikeTypeChartPerDay(pourcentageEbikePerDay).series}
                        type="bar"
                        width="400%"
                        height="400px"
                    />

                    <h2>Deplacement pertinents {(selectedCommunes !== "" && selectedCommunes !== "all") ? `à ${selectedCommunes}` : ""}</h2>
                    <h4 style={{ color: "#444444" }}>Cette requête SQL permet d'obtenir la liste des stations de vélos en libre-service qui ont un taux de remplissage moyen inférieur à 10% en moyenne à 22h. Pour chaque station, la requête retourne également la station la plus proche qui a un taux de remplissage moyen supérieur à 80%.</h4>
                    <ul className={style.liste}>
                        {deplacementloading ? <ChartLoading /> : deplacementpertinent.map((deplacement) => (
                            <li key={deplacement.name} >
                                <span><Link href={`/station/${deplacement.stationcode}`}>{deplacement.name}</Link> (remplis à {(parseFloat(deplacement.remplissage_moyen) * 100).toFixed(1)}% à 22h)</span>&emsp; -{">"}&emsp;
                                <span><Link href={`/station/${deplacement.station_pleine}`}>{deplacement.station_pleine_name}</Link> (remplis à {(parseFloat(deplacement.remplissage_station_pleine) * 100).toFixed(1)}% à 22h)</span>
                                <p>{deplacement.distance.toFixed(1)}m</p>
                            </li>
                        ))}
                    </ul>

                </div>
            )}
        </>
    );
}
