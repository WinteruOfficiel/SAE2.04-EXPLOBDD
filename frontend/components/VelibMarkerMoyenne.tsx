import { Marker, Popup } from "react-leaflet";
import { VelibDataMoyenne } from "../types/velib_data";
import style from '../styles/map.module.scss'
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { relative } from "path";


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

const testIcon = L.divIcon({
    className: style.icon,
    html: ReactDOMServer.renderToString(
        <div>x</div>
    )
})

function generateIcon(pourcentage: number): L.DivIcon {
    pourcentage = Math.round(pourcentage)
    const icon = L.divIcon({
        className: style.icon,
        iconSize: [50, 50],
        popupAnchor: [0, -30],
        html: ReactDOMServer.renderToString(
            <div className={style.icon}>
                <SvgIcon perc={pourcentage} text={pourcentage.toString() + "%"} color={getIconColor(pourcentage)} />
            </div>
        )
    });
    return icon;
}


export default function VelibMarkerMoyenne({ station, setSelectedStation }: { station: VelibDataMoyenne, setSelectedStation: React.Dispatch<React.SetStateAction<VelibDataMoyenne | null>> }): JSX.Element {
    return (
        <Marker key={station.stationcode} icon={generateIcon(station.remplissage_moyen)} position={[station.coordonnees_geo.y, station.coordonnees_geo.x]}  >
            <Popup>
                <div className={style.popup}>
                    <h2>{station.name}</h2>
                    <p><strong>Communes : </strong>{station.nom_arrondissement_communes}</p>
                    <p><strong>Capacité : </strong>{station.capacity}</p>
                    <p><strong>Nombres de vélos disponible en moyenne :</strong>{station.velos_disponibles.toFixed(2)} ({Math.round(station.remplissage_moyen)}%) </p>
                    <p><strong>Répartition des vélos moyenne :</strong> {station.velos_electriques_disponibles.toFixed(2)} électriques, {station.velos_mecaniques_disponibles.toFixed(2)} mécaniques</p>
                    <p><strong>Nombre de places disponibles en moyenne :</strong> {station.docks_disponibles.toFixed(2)} ({Math.round((station.docks_disponibles / station.capacity) * 100) || 0}%)</p>
                </div>
            </Popup>
        </Marker>
    )
}
