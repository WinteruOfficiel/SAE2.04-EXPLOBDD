import { VelibStationStatus } from '../types/velib_data';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from './MarkerClusterGroup';

const PARIS_CENTER: LatLngExpression = [48.856, 2.352]


// this is a "barrel file" that prevents the ClientMap from ever getting loaded in the server.
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import { LatLngExpression } from 'leaflet';
import VelibMarker from './VelibMarkerComponent';


// { velib_data }: { velib_data: VelibStationInformation[] }
export default function VelibMap({ velib_data }: { velib_data: VelibStationStatus[] }): JSX.Element {
    return (
        <MapContainer center={PARIS_CENTER} zoom={13} scrollWheelZoom={true} style={{ height: 650, width: "70%", borderRadius: "16px" }}>
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MarkerClusterGroup>
                {velib_data.map((station) => <VelibMarker key={station.stationcode} station={station}></VelibMarker>)}
            </MarkerClusterGroup>
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