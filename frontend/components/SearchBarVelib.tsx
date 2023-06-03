import React from "react";
import { VelibDataMoyenne, VelibStationInformation, VelibStationStatus } from "../types/velib_data";
import SelectorCommune from "./selectorCommune";


async function getCommunes() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/each_arrondissement`, { cache: "no-cache" })
    const data: any = await res.json()
    return data
}

export default function SearchBarVelib({ velib_data, setFilteredVelibData }: { velib_data: VelibDataMoyenne[] | VelibStationStatus[], setFilteredVelibData: any}) {
    const [all_communes, setAllCommunes] = React.useState<string[]>([])
    const [commune, setCommune] = React.useState<string>("all")
    const [current_search, setCurrentSearch] = React.useState<string>("")

    const velib_data_typed = velib_data as VelibStationInformation[]

    React.useEffect(() => {

        getCommunes().then((data) => {
            if (!data) return
            setAllCommunes(data.sort())
        });
    }, []);

    React.useEffect(() => {
        if (commune === "all") {
            setFilteredVelibData(velib_data_typed.filter((station) => station.name.toLowerCase().startsWith(current_search.toLowerCase())))
            return
        }
        setFilteredVelibData(velib_data_typed.filter((station) => station.nom_arrondissement_communes === commune && station.name.toLowerCase().includes(current_search.toLowerCase())))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [commune, velib_data, current_search])

    return (
        <>
            <input type="search" value={current_search} onChange={e => setCurrentSearch(e.target.value)} placeholder="Rechercher une station" />
            <SelectorCommune setCommune={setCommune} AllCommunes={all_communes} />
        </>
    )
}