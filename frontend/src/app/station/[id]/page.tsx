"use client";

import React from "react"
import { DataTodayPerStation } from "../../../../types/velib_data"
import AnalyseUneStation from "../../../../components/AnalyseUneStation";
import StartEndDatePicker from "../../../../components/DatePicker";

async function getData(stationcode: string, start?: string, end?: string) {
  start = start || ""
  end = end || ""

  const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/stats_par_station?type=aujourdhui&stationcode=${stationcode}&startDate=${start}&endDate=${end}`, { next: { revalidate: 60 } })
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
    const [min_max_date, setMinMaxDate] = React.useState<{min: string, max: string}>({min: "", max: ""})
    const [date, setDate] = React.useState<{min: string, max: string}>({min: "", max: ""})
    const [loading, setLoading] = React.useState<boolean>(true)
    
    React.useEffect(() => {
        async function fetchData() {
            const minmaxdate = await getMinmaxDate(params.id)

            if (!minmaxdate) return

            setMinMaxDate({ min: minmaxdate.min, max: minmaxdate.max })

            const date = new Date()
            const lastweek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7)
            setDate({ min: lastweek.toISOString().split("T")[0], max: date.toISOString().split("T")[0]})
        }

        fetchData()
    }, [params.id])

    React.useEffect(() => {
        console.log(station_data)
    }, [station_data])

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

    return <>
      <h1>Station {params.id}</h1>
      <StartEndDatePicker date={date} setDate={setDate} min_max_date={min_max_date} />
      {!loading && station_data && station_data.length > 0 &&
      <AnalyseUneStation today_data={station_data} start_date={date.min} end_date={date.max} />
      }
    </>
  }