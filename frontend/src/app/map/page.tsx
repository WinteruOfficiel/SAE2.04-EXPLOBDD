"use client";

import React from "react";

import style from "../../../styles/header.module.scss";
import TempsReelVue from "../../../components/TempsReelVue";
import GeneralVue from "../../../components/GeneralVue";


function renderCondition(temps_reel: boolean) {
    if (temps_reel) {
        return <>
            <h2>Temps réel</h2>
            <TempsReelVue />
        </>
    } else {
        return <>
            <h2>Moyenne</h2>
            <GeneralVue />
        </>
    }
}



export default function Map() {
    const [temps_reel, setTempsReel] = React.useState<boolean>(false)

    return <>
        <main id={style.main_container}>
            <button id={style.tempsreelbtn} onClick={() => setTempsReel(!temps_reel)}>
                <span>Temps réel</span>
                <span>{temps_reel ? "ON" : "OFF"}</span>
                </button>
            {renderCondition(temps_reel)}
        </main>
    </>
}