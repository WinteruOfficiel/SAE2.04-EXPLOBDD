import { DataTodayPerStation } from "../types/velib_data";
import { ApexOptions } from "apexcharts";
import React from "react";
import Chart from "react-apexcharts";
import formatDateFrench from "../lib/formatFrenchData";

function todayGraphOptions(today_data: DataTodayPerStation[], start_date: string, end_date: string): ApexOptions {
    // 3 courbes
    // de bas en haut Dock disponible, vélo, vélo électrique
    // en nombre pas en pourcentage
    // xaxis : heure de la journée (0h, 1h, 2h, 3h, 4h, 5h, 6h, 7h, ... 23h)
    // yaxis : nombre de vélos ou de docks

    let mindate = new Date(start_date)
    mindate.setHours(0, 0, 0, 0)
    let maxdate = new Date(end_date)
    maxdate.setHours(23, 59, 59, 999)

    return {
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

function todayGraphSeries(today_data: DataTodayPerStation[]): ApexAxisChartSeries {
    // 3 courbes
    // de bas en haut Dock disponible, vélo, vélo électrique
    // en nombre pas en pourcentage
    // xaxis : date utc
    // yaxis : nombre de vélos ou de docks
    return [
        {
            name: "Dock disponible",
            data: today_data.map((data) => ({
                x: new Date(data.utcdate).getTime(),
                y: data.numdocksavailable
            }))
        },
        {
            name: "Vélo mécanique",
            data: today_data.map((data) => ({
                x: new Date(data.utcdate).getTime(),
                y: data.mechanical
            }))
        },
        {
            name: "Vélo électrique",
            data: today_data.map((data) => ({
                x: new Date(data.utcdate).getTime(),
                y: data.ebike
            }))
        }
    ];
}

export default function AnalyseUneStation({ today_data, start_date, end_date }: { today_data: DataTodayPerStation[], start_date: string, end_date: string }) {

    if (!today_data || today_data.length == 0) {
        return <></>
    }

    return <>
        <h2>Donnés aujourd'hui</h2>
        <Chart
            options={todayGraphOptions(today_data, start_date, end_date)}
            series={todayGraphSeries(today_data)}
            type="line"
            width="80%"
            height="400px"
            padding={{ left: 50, top: 10, right: 50, bottom: 10 }}
        />
    </>
}