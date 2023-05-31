'use client';

import dynamic from 'next/dynamic'
import React from 'react'
import { VelibStationStatus } from '../types/velib_data'

import style from "../styles/header.module.scss";
import SearchBarVelib from './SearchBarVelib';
import 'react-modern-calendar-datepicker/lib/DatePicker.css';
import { DayRange } from '@hassanmojab/react-modern-calendar-datepicker';
import { Calendar } from '../lib/datePicker';

async function getData() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/remplissage_moyen`, { next: { revalidate: 60 } })
    const data: any = await res.json()
    return data
}


export default function GeneralVue() {
    const [selected_station, setSelectedStation] = React.useState<VelibStationStatus | null>(null)
    const [velib_data, setVelibData] = React.useState<VelibStationStatus[]>([])
    const [filtered_velib_data, setFilteredVelibData] = React.useState<VelibStationStatus[]>([])
    const [daterange, setDaterange] = React.useState<DayRange>({
        from: {
            year: 2023,
            month: 5,
            day: 5
        },
        to: {
            year: 2023,
            month: 5,
            day: 6
        }
    })

    React.useEffect(() => {
        if (selected_station) {
            console.log(selected_station)
        }
    }, [selected_station])


    React.useEffect(() => {
        getData().then((data) => {
            if (!data) return
            setVelibData(data)
        })
    }, [])

    React.useEffect(() => {
        console.log(daterange)
    }, [daterange])


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


    return (
        <>
            <h3>Recherche</h3>
            <div>
                <div id={style.filter_control_container}>
                    <SearchBarVelib velib_data={velib_data} setFilteredVelibData={setFilteredVelibData} />
                </div>
                <Calendar
                    value={daterange}
                    onChange={setDaterange}
                    shouldHighlightWeekends
                />
            </div>

            {
                velib_data.length > 0 ? (
                    <>
                        <VelibMap velib_data={filtered_velib_data} setSelectedStation={setSelectedStation} />
                        <h1>Informations</h1>
                        <div style={{ width: '75%' }}>
                            <AnalyseGeneral />
                        </div>
                    </>
                ) : (
                    <p>Chargement...</p>
                )
            }
        </>
    )
}