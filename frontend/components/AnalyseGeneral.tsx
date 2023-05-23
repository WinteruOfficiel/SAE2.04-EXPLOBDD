'use client';

import { ApexOptions } from "apexcharts";
import React from "react";
import Chart from "react-apexcharts";

import style from "../styles/charts.module.scss";

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

function getPourcentageBikeTypeChart(pourcentageEbike: number): { series: number[], options: ApexOptions } {
    return {
        series: [pourcentageEbike, 100 - pourcentageEbike],
        options: {
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

function formatDateFrench(date: Date) {
    const mois = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const jour = date.getDate();
    const moisIndex = date.getMonth();
    const annee = date.getFullYear();

    const moisFrench = mois[moisIndex];

    return `${jour} ${moisFrench} ${annee}`;
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




export default function AnalyseGeneral() {
    const [pourcentageEbike, setPourcentageEbike] = React.useState<number>(0)
    const [pourcentageEbikePerDay, setPourcentageEbikePerDay] = React.useState<{ jour: string, value: number }[]>([])
    const [isLoading, setIsLoading] = React.useState<boolean>(true)

    React.useEffect(() => {
        const fetchData = async () => {
            const [totalData, perDayData] = await Promise.all([getPourcentageEbike(), getPourcentageEbike(true)]);

            if (!totalData || !perDayData) return

            setPourcentageEbike(totalData)

            setPourcentageEbikePerDay(perDayData as { jour: string, value: number }[])

            setIsLoading(false)
        };

        fetchData();
    }, [])

    React.useEffect(() => {
        console.log(getPourcentageBikeTypeChart(pourcentageEbike))
    }, [pourcentageEbike])

    return (
        <>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <div id={style.chartContainer}>
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

                </div>
            )}
        </>
    );
}
