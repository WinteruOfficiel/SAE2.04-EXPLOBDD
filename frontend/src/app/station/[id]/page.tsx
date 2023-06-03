"use client";

import React from "react"
import { DataTodayPerStation, VelibStationStatus } from "../../../../types/velib_data"
import AnalyseUneStation from "../../../../components/AnalyseUneStation";
import StartEndDatePicker from "../../../../components/DatePicker";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { ChartLoading } from "../../../../components/Loading";

async function getData(stationcode: string, start?: string, end?: string) {
  start = start || ""
  end = end || ""

  const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/stats_par_station?type=aujourdhui&stationcode=${stationcode}&startDate=${start}&endDate=${end}`, { next: { revalidate: 60 } })
  const data: any = await res.json()
  return data
}

function getPourcentageBikeTypeChart(pourcentageEbike: number): { series: number[], options: ApexOptions } {
  return {
    series: [Math.round(pourcentageEbike), 100 - Math.round(pourcentageEbike)],
    options: {
      title: {
        text: "Pourcentage de vélo électrique et mécanique pour cette station",
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

async function getRepartitionStat(stationcode: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/stats_par_station?type=pourcebike&stationcode=${stationcode}`, { next: { revalidate: 60 } })
  const data: any = await res.json()
  return data
}

async function getDynamicStationData(stationcode: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/dynamic_data?stationcode=${stationcode}`, { next: { revalidate: 60 } })
  const data: any = await res.json()
  return data
}

async function getMinmaxDate(stationcode: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/minmaxdate?stationcode=${stationcode}`, { next: { revalidate: 60 } })
  const data: any = await res.json()
  return data
}

export default function StationHistory({ params }: { params: { id: string } }) {
  const [station_data, setStationData] = React.useState<DataTodayPerStation[]>([])
  const [min_max_date, setMinMaxDate] = React.useState<{ min: string, max: string }>({ min: "", max: "" })
  const [date, setDate] = React.useState<{ min: string, max: string }>({ min: "", max: "" })
  const [station_dynamic_data, setStationDynamicData] = React.useState<VelibStationStatus | null>(null)
  const [repartition_stat, setRepartitionStat] = React.useState<number>(-1)
  const [loading, setLoading] = React.useState<boolean>(true)

  React.useEffect(() => {
    async function fetchData() {
      const [minmaxdate, dynamic_station_data, repartStat] = await Promise.all([getMinmaxDate(params.id), getDynamicStationData(params.id), getRepartitionStat(params.id)])


      if (!minmaxdate || !dynamic_station_data || !repartStat) return

      console.log(dynamic_station_data)

      setMinMaxDate({ min: minmaxdate.min, max: minmaxdate.max })
      setStationDynamicData(dynamic_station_data[0])

      setRepartitionStat(parseFloat(repartStat.value))

      const date = new Date()
      const lastweek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7)
      setDate({ min: lastweek.toISOString().split("T")[0], max: date.toISOString().split("T")[0] })
    }

    fetchData()
  }, [params.id])

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const data = await getData(params.id, date.min, date.max)
      if (!data) return
      setStationData(data)
      setLoading(false)
    }

    fetchData()
  }, [date])

  const VelibMapUneStation = React.useMemo(() => dynamic(
    () => import("../../../../components/EmplacementUneStation")
  ), [])

  return <>
    <div style={{ margin: "0 5%" }}>
      <h1>{loading ? '...' : station_dynamic_data?.name} ({params.id})</h1>
      <hr />
      <h2>Donnés statiques</h2>
      {!loading && station_dynamic_data ?
        <>
          <p><strong>Commune :</strong> {station_dynamic_data.nom_arrondissement_communes}</p>
          <p><strong>Capacité :</strong> {station_dynamic_data.capacity}</p>

          <h3>Emplacement de la station</h3>
          <VelibMapUneStation velib_data={station_dynamic_data} />
          <hr />
          <h3>Informations temps réel</h3>
          <p><strong>Vélos disponible :</strong> {station_dynamic_data.numbikesavailable} ({Math.round((station_dynamic_data.numbikesavailable / station_dynamic_data.capacity) * 100) || 0}%)</p>
          <p><strong>Répartition des vélos :</strong> {station_dynamic_data.ebike} <Image src="/electric_symbol.svg" alt="electric symbole" width={15} height={15} />, {station_dynamic_data.mechanical} <Image src="/gear.svg" alt="mecanique symbole" width={15} height={15} /></p>
          <p><strong>Places disponibles :</strong> {station_dynamic_data.numdocksavailable} ({Math.round((station_dynamic_data.numdocksavailable / station_dynamic_data.capacity) * 100) || 0}%)</p>
          <hr />
          <h3>Répartition des vélos</h3>
          {repartition_stat > 0 ?
            <Chart
              options={getPourcentageBikeTypeChart(repartition_stat).options}
              series={getPourcentageBikeTypeChart(repartition_stat).series}
              type="donut"
              width={"40%"}
            /> : <ChartLoading />
          }
        </> : <ChartLoading />
      }
      <h2>Donnés historiques de la station</h2>
      <div style={{ marginBottom: '1em' }}>
        <StartEndDatePicker date={date} setDate={setDate} min_max_date={min_max_date} />
      </div>
      {!loading && station_data && station_data.length > 0 ?
        <AnalyseUneStation today_data={station_data} start_date={date.min} end_date={date.max} /> : <ChartLoading />
      }
    </div>

  </>
}