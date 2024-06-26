'use client';

import dynamic from 'next/dynamic'
import React from 'react'
import { VelibDataMoyenne, VelibStationStatus } from '../types/velib_data'

import style from "../styles/header.module.scss";
import SearchBarVelib from './SearchBarVelib';
import StartEndDatePicker from './DatePicker';

import { ChartLoading, MapLoading } from './Loading';

async function getData(start?: string, end?: string) {
    start = start || ""
    end = end || ""
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/remplissage_moyen?startDate=${start}&endDate=${end}`, { next: { revalidate: 60 } })
    const data: any = await res.json()
    return data
}

async function getMinmaxDate() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/minmaxdate`, { next: { revalidate: 60 } })
    const data: any = await res.json()
    return data
}


async function getNbStation(commune: string) {
    commune = commune == null ? "" : commune
    commune = commune === "all" ? "" : commune
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/stats?type=nbstation&commune=${commune}`, { next: { revalidate: 60 } })
    const data: any = await res.json()
    return data
}


export default function GeneralVue() {
    const [selected_station, setSelectedStation] = React.useState<VelibDataMoyenne | null>(null)
    const [velib_data, setVelibData] = React.useState<VelibDataMoyenne[]>([])
    const [filtered_velib_data, setFilteredVelibData] = React.useState<VelibDataMoyenne[]>([])
    const [min_max_date, setMinMaxDate] = React.useState<{ min: string, max: string }>({ min: "", max: "" })
    const [date, setDate] = React.useState<{ min: string, max: string }>({ min: "", max: "" })
    const [selected_commune, setSelectedCommune] = React.useState<string>("all");
    const [loading, setLoading] = React.useState<boolean>(true)
    const [loadMinMaxDate, setLoadMinMaxDate] = React.useState<boolean>(true)
    const [nb_station, setNbStation] = React.useState<number>(-1);

    React.useEffect(() => {
        if (selected_station) {
            console.log(selected_station)
        }

    }, [selected_station])

    React.useEffect(() => {
        async function fetchNbStation() {
            setNbStation(-1)
            const nb_station = await getNbStation(selected_commune)
            setNbStation(nb_station.nb_stations)
        }
        fetchNbStation()
    }, [selected_commune])


    React.useEffect(() => {
        /* getData().then((data) => {
            if (!data) return
            setVelibData(data)
        }) */
        async function fetchData() {
            setLoadMinMaxDate(true)
            setLoading(true)
            //const [minmaxdate, velib_data] = await Promise.all([getMinmaxDate(), getData()])
            const minmaxdate = await getMinmaxDate()

            if (!minmaxdate) return
            setLoadMinMaxDate(false)

            // récupérer les données de la semaine dernière par défaut (pour éviter de faire trop de requêtes)
            const date = new Date()
            const lastweek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7)
            const velib_data = await getData(lastweek.toISOString().split("T")[0], date.toISOString().split("T")[0])

            setMinMaxDate({ min: minmaxdate.min, max: minmaxdate.max })
            setDate({ min: lastweek.toISOString().split("T")[0], max: date.toISOString().split("T")[0] })

            setVelibData(velib_data)
            setLoading(false)
        }

        async function fetchNbStation() {
            setNbStation(-1)
            const nb_station = await getNbStation(selected_commune)
            setNbStation(nb_station.nb_stations)
        }

        fetchData()
        fetchNbStation()
    }, [])

    function update() {
        setLoading(true)
        getData(date.min, date.max).then((data) => {
            if (!data) return
            setVelibData(data)
            setLoading(false)
        });
    }

    function lastweek() {
        const date = new Date()
        const lastweek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7)
        setDate({ min: lastweek.toISOString().split("T")[0], max: date.toISOString().split("T")[0] })
        console.log(date)
        update()
    }

    // Ceci est un composant dynamique qui ne sera chargé que côté client. Leaftlet ne fonctionne pas côté serveur.
    const VelibMap = React.useMemo(() => dynamic(
        () => import('./VelibMap'),
        {
            loading: () => <p>Chargement...</p>,
            ssr: false // cette ligne est importante. Elle empêche le rendu côté serveur
        }
    ), [])

    const AnalyseGeneral = React.useMemo(() => dynamic(
        () => import('./AnalyseGeneral'),
        {
            loading: () => <p>Chargement...</p>,
            ssr: false // cette ligne est importante. Elle empêche le rendu côté serveur
        }
    ), [])

    /*     const Calendar = React.useMemo(() => dynamic(
            () => import('../lib/DatePicker').then((mod) => mod.Calendar),
            {
                loading: () => <p>Chargement...</p>,
                ssr: false // cette ligne est importante. Elle empêche le rendu côté serveur
            }
        ), []) */

    let val;
    if (loading) {
        val = (<MapLoading />);
    } else {
        val = (<>
            {
                velib_data.length > 0 ? (
                    <>
                        <VelibMap velib_data={filtered_velib_data} />
                    </>
                ) : (
                    <MapLoading />
                )
            }
        </>)
    }

    return (
        <>
            {loadMinMaxDate ? <ChartLoading /> : (<><h3>Recherche</h3>
                <div id={style.filterContainer}>
                    <div id={style.filter_control_container}>
                        <SearchBarVelib velib_data={velib_data} setFilteredVelibData={setFilteredVelibData} setSelectedCommune={setSelectedCommune} />
                    </div>
                    <h3>Date</h3>
                    <StartEndDatePicker min_max_date={min_max_date} date={date} setDate={setDate} />
                    <div className={style.btnFilters}>
                        <input type="button" value="Appliquer" onClick={() => update()} />
                        <input type="button" value="Reset" onClick={() => setDate({ min: min_max_date.min, max: min_max_date.max })} />
                        <input type="button" value="Dernière semaine" onClick={() => lastweek()} />
                    </div>
                </div>
            </>)}
            {val}
            <h1>Informations  {(selected_commune !== "" && selected_commune !== "all") ? `pour la ville de ${selected_commune}` : ""}</h1>
            <p><strong>Nombre de stations :</strong> {nb_station > 0 ? nb_station : "Chargement..."}</p>
            <div style={{ width: '75%' }}>
                <AnalyseGeneral minmaxdate={date} selectedCommunes={selected_commune} filtered_velib_data={filtered_velib_data} />
            </div>
        </>
    )
}