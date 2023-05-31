import dynamic from 'next/dynamic'
import React from 'react'
import { VelibStationStatus } from '../types/velib_data'

import style from "../styles/header.module.scss";
import SearchBarVelib from './SearchBarVelib';
import { LatLngExpression } from 'leaflet';

const PARIS_CENTER: LatLngExpression = [48.856, 2.352]

async function getData() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/dynamic_data`, { next: { revalidate: 60 } })
    const data: any = await res.json()
    return data
}

function getDataPeriodic(setVelibData: React.Dispatch<React.SetStateAction<VelibStationStatus[]>>) {
    getData().then((data) => {
        if (!data) return
        // pirnt [hh:mm:ss]
        console.log(`[${new Date().toLocaleTimeString()}] refreshed`)
        setVelibData(data)
        setTimeout(() => getDataPeriodic(setVelibData), 1000 * 60)
    }
    )
}

export default function TempsReelVue() {
    const [selected_station, setSelectedStation] = React.useState<VelibStationStatus | null>(null)
    const [velib_data, setVelibData] = React.useState<VelibStationStatus[]>([])
    const [filtered_velib_data, setFilteredVelibData] = React.useState<VelibStationStatus[]>([])

    React.useEffect(() => {
        if (selected_station) {
            console.log(selected_station)
        }
    }, [selected_station])


    React.useEffect(() => {
        // TODO : nettoyer timeout quand on quitte la page
        getDataPeriodic(setVelibData)
    }, [])

    // Ceci est un composant dynamique qui ne sera chargé que côté client. Leaftlet ne fonctionne pas côté serveur.
    const VelibMap = React.useMemo(() => dynamic(
        () => import('./VelibMap'),
        {
            loading: () => <p>Chargement...</p>,
            ssr: false // cette ligne est importante. Elle empêche le rendu côté serveur
        }
    ), [])

    const AnalyseTempsReel = React.useMemo(() => dynamic(
        () => import('./AnalyseTempsReel'),
        {
            loading: () => <p>Chargement...</p>,
            ssr: false // cette ligne est importante. Elle empêche le rendu côté serveur
        }
    ), [])


    return (
        <>
            <div id={style.filter_control_container}>
                <SearchBarVelib velib_data={velib_data} setFilteredVelibData={setFilteredVelibData} />
            </div>
            {
                velib_data.length > 0 ? (
                    <>
                        <VelibMap velib_data={filtered_velib_data} setSelectedStation={setSelectedStation} />
                        <h1>Informations</h1>
                        <div style={{ width: '75%' }}>
                            <AnalyseTempsReel />
                        </div>
                    </>
                ) : (
                    <p>Chargement...</p>
                )
            }
        </>
    )
}