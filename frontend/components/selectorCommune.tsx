import React from "react"

type Commune = {
    nom_arrondissement_communes: string
}


export default function SelectorCommune({ setCommune, AllCommunes }: { setCommune: React.Dispatch<React.SetStateAction<string>>, AllCommunes: string[] }) {

    return (
        <>
            <select onChange={(e) => setCommune(e.target.value)}>
                <option value="all">Toutes les communes</option>
                {AllCommunes.map((commune) => <option key={commune} value={commune}>{commune}</option>)}
            </select>
        </>
    );

}