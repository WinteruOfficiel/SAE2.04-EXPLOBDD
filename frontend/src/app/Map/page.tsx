"use client";

import { VelibStationInformation, VelibStationStatus } from "../../../types/velib_data";
import React from "react";
import dynamic from "next/dynamic";
import SelectorCommune from "../../../components/selectorCommune";

async function getData() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/dynamic_data`, { next: { revalidate: 120 } })
    const data: any = await res.json()
    return data
}

async function getCommunes() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/each_arrondissement`, { next: { revalidate: 120 } })
    const data: any = await res.json()
    return data
}

export default function Map() {
    const [commune, setCommune] = React.useState<string>("all")
    const [velib_data, setVelibData] = React.useState<VelibStationStatus[]>([])
    const [filtered_velib_data, setFilteredVelibData] = React.useState<VelibStationStatus[]>([])
    const [current_search, setCurrentSearch] = React.useState<string>("")
    const [all_communes, setAllCommunes] = React.useState<string[]>([])


    React.useEffect(() => {
        getData().then((data) => {
            if (!data) return
            setVelibData(data)
        })

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


    // Ceci est un composant dynamique qui ne sera chargé que côté client. Leaftlet ne fonctionne pas côté serveur.
    const VelibMap = React.useMemo(() => dynamic(
        () => import('../../../components/VelibMap'),
        {
            loading: () => <p>Chargement...</p>,
            ssr: false // cette ligne est importante. Elle empêche le rendu côté serveur
        }
    ), [])
    return <>
        <div>
            <input type="search" value={current_search} onChange={e => setCurrentSearch(e.target.value)} /*disabled={commune == 'all'} title={commune == 'all' ? "Barre de recherche désactivée si vous avez sélectionné 'Toutes les communes' (pour des raisons de performances)" : ""}*/ />
            <SelectorCommune setCommune={setCommune} AllCommunes={all_communes} />
        </div>
        {velib_data.length > 0 ? (
            <VelibMap velib_data={filtered_velib_data} />
        ) : (
            <p>Chargement...</p>
        )}
    </>
}