import { VelibStationStatus } from '../types/velib_data';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import style from './hueRotate.module.scss';


// this is a "barrel file" that prevents the ClientMap from ever getting loaded in the server.
import 'leaflet/dist/leaflet.css'


// { velib_data }: { velib_data: VelibStationInformation[] }
export default function VelibMap({ velib_data }: { velib_data: VelibStationStatus[] }): JSX.Element {

    return (
        <MapContainer center={[48.856, 2.352]} zoom={13} scrollWheelZoom={true} style={{ height: 800, width: "100%" }}>
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {velib_data.map((station) => <Marker key={station.stationcode} position={[station.coordonnees_geo.y, station.coordonnees_geo.x]}>
                <Popup>
                    <div className={style.popup}>
                        <h2>Station : {station.name}</h2>
                        <p><strong>Capacité : </strong>{station.capacity}</p>
                        <p><strong>Nombres de vélos disponible :</strong> {station.numbikesavailable} ({Math.round(station.numbikesavailable / station.capacity * 100)}%)</p>
                        <p><strong>Répartition des vélos :</strong> {station.ebike} électriques, {station.mechanical} mécaniques</p>
                        <p><strong>Nombre de places disponibles :</strong> {station.numdocksavailable} ({Math.round(station.numdocksavailable / station.capacity * 100)}%)</p>
                    </div>

                </Popup>
            </Marker>)}
        </MapContainer>
    )
}

/*
<Marker position={[velib_data[0].coordonnees_geo.y, velib_data[0].coordonnees_geo.x]}>
                <Popup>
                    A pretty CSS3 popup. <br /> Easily customizable.
                </Popup>
            </Marker>
            */