import { Marker, Popup, useMap } from "react-leaflet";
import { VelibStationStatus } from "../types/velib_data";
import style from '../styles/map.module.scss'
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import Image from 'next/image';

// volé ici : https://gist.github.com/nik-john/7213821efb3d8a90f50252ea4d9d8c1d#file-icon-js
function SvgIcon({ perc, text, color }: { perc: number, text: string, color: string }): JSX.Element {
    return (
        <svg width="50px" height="50px" viewBox="0 0 42 42" className="donut" aria-labelledby="beers-title beers-desc" role="img">
            <circle className="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="white" role="presentation"></circle>
            <circle className="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#d2d3d4" strokeWidth="3" role="presentation"></circle>
            <circle className="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke={color} strokeWidth="3" strokeDasharray={`${perc} ${100 - perc}`} strokeDashoffset="25" aria-labelledby="donut-segment-1-title donut-segment-1-desc">
            </circle>
            <g className="chart-text">
                <text className="chart-number" x="50%" y="52%" dominantBaseline="middle" textAnchor="middle">
                    {text}
                </text>
            </g>
        </svg>
    )
}

function getIconColor(perc: number) {
    // hsl(0, 100%, 40%) -> hsl(130, 100%, 40%)
    const hue = Math.round(130 * (perc / 100))
    return `hsl(${hue}, 100%, 40%)`
}

function generateIcon(numbikesavailable: number, capacity: number, installed: string): L.DivIcon {
    const pourcentage: number = capacity > 0 ? Math.round((numbikesavailable / capacity) * 100) : 0;
    const installedbool = installed == "OUI" ? true : false
    const icon = L.divIcon({
        className: style.icon,
        iconSize: [50, 50],
        popupAnchor: [0, -30],
        html: ReactDOMServer.renderToString(
            <div className={style.icon}>
                {installedbool ?
                    <SvgIcon perc={pourcentage} text={numbikesavailable.toString()} color={getIconColor(pourcentage)} />
                    : <SvgIcon perc={100} text={"x"} color={"#000000"} />
                }
            </div>
        )
    });
    return icon;
}

export default function VelibMarker({ station, setSelectedStation }: { station: VelibStationStatus, setSelectedStation: React.Dispatch<React.SetStateAction<VelibStationStatus | null>> }): JSX.Element {
    return (
        <Marker key={station.stationcode} icon={generateIcon(station.numbikesavailable, station.capacity, station.is_installed)} position={[station.coordonnees_geo.y, station.coordonnees_geo.x]} >
            <Popup>
                <div className={style.popup}>
                    <h2><u>{station.name}</u></h2>
                    {station.is_installed == "NON" && <h2><strong>Station fermée</strong></h2>}
                    <p><strong>Identifiant : </strong>{station.stationcode}</p>
                    <p><strong>Communes : </strong>{station.nom_arrondissement_communes}</p>
                    <p><strong>Capacité : </strong>{station.capacity}</p>
                    <hr />
                    <p><strong>Vélos disponible :</strong> {station.numbikesavailable} ({Math.round((station.numbikesavailable / station.capacity) * 100) || 0}%)</p>
                    <p><strong>Répartition des vélos :</strong> {station.ebike} <Image src="electric_symbol.svg" alt="electric symbole" width={15} height={15} />, {station.mechanical} <Image src="gear.svg" alt="mecanique symbole" width={15} height={15} /></p>
                    <p><strong>Places disponibles :</strong> {station.numdocksavailable} ({Math.round((station.numdocksavailable / station.capacity) * 100) || 0}%)</p>
                    <hr />
                    <button className={style.clickbtn} onClick={() => setSelectedStation(station)}>Voir les données historique</button>
                </div>
            </Popup>
        </Marker>
    )
}
