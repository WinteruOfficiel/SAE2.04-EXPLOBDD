"use client";

import { VelibStationStatus } from "../../../types/velib_data";
import React from "react";
import dynamic from "next/dynamic";
import SelectorCommune from "../../../components/selectorCommune";

import style from "../../../styles/header.module.scss";

async function getData() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/dynamic_data`, { next: { revalidate: 60 } })
    const data: any = await res.json()
    return data
}

async function getCommunes() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/each_arrondissement`, { next: { revalidate: 120 } })
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

export default function Map() {
    const [commune, setCommune] = React.useState<string>("all")
    const [velib_data, setVelibData] = React.useState<VelibStationStatus[]>([])
    const [filtered_velib_data, setFilteredVelibData] = React.useState<VelibStationStatus[]>([])
    const [current_search, setCurrentSearch] = React.useState<string>("")
    const [all_communes, setAllCommunes] = React.useState<string[]>([])

    const [selected_station, setSelectedStation] = React.useState<VelibStationStatus | null>(null)


    React.useEffect(() => {
        // TODO : nettoyer timeout quand on quitte la page
        getDataPeriodic(setVelibData)


        getCommunes().then((data) => {
            if (!data) return
            setAllCommunes(data.sort())
        });
    }, [])


    // filtrer velib_data selon la commune
    React.useEffect(() => {
        if (commune === "all") {
            setFilteredVelibData(velib_data.filter((station) => station.name.toLowerCase().startsWith(current_search.toLowerCase())))
            return
        }
        setFilteredVelibData(velib_data.filter((station) => station.nom_arrondissement_communes === commune && station.name.toLowerCase().includes(current_search.toLowerCase())))
    }, [commune, velib_data, current_search])

    React.useEffect(() => {
        if (selected_station) {
            console.log(selected_station)
        }
    }, [selected_station])


    // Ceci est un composant dynamique qui ne sera chargé que côté client. Leaftlet ne fonctionne pas côté serveur.
    const VelibMap = React.useMemo(() => dynamic(
        () => import('../../../components/VelibMap'),
        {
            loading: () => <p>Chargement...</p>,
            ssr: false // cette ligne est importante. Elle empêche le rendu côté serveur
        }
    ), [])

    const AnalyseGeneral = React.useMemo(() => dynamic(
        () => import('../../../components/AnalyseGeneral'),
        {
            loading: () => <p>Chargement...</p>,
            ssr: false // cette ligne est importante. Elle empêche le rendu côté serveur
        }
    ), [])



    return <>
        <header id={style.header}>
            <h1>Analyse Vélib</h1>
        </header>
        <main id={style.main_container}>
            <div id={style.filter_control_container}>
                <input type="search" value={current_search} onChange={e => setCurrentSearch(e.target.value)} /*disabled={commune == 'all'} title={commune == 'all' ? "Barre de recherche désactivée si vous avez sélectionné 'Toutes les communes' (pour des raisons de performances)" : ""}*/ />
                <SelectorCommune setCommune={setCommune} AllCommunes={all_communes} />
            </div>
            {velib_data.length > 0 ? (
                <>
                    <VelibMap velib_data={filtered_velib_data} setSelectedStation={setSelectedStation} />
                    <h1>Informations</h1>
                    <div style={{ width: '75%' }}>
                        <AnalyseGeneral />
                    </div>
                </>
            ) : (
                <p>Chargement...</p>
            )}
        </main>
    </>
}