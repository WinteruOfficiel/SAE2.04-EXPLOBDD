import { VelibDataMoyenne, VelibStationStatus } from '../types/velib_data';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from './MarkerClusterGroup';

const PARIS_CENTER: LatLngExpression = [48.856, 2.352]


// this is a "barrel file" that prevents the ClientMap from ever getting loaded in the server.
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import { LatLngExpression } from 'leaflet';
import VelibMarker from './VelibMarkerComponent';
import VelibMarkerMoyenne from './VelibMarkerMoyenne';
import React from 'react';
import { redirect } from 'next/navigation';


function conditionnelRenderMarker(velib_data: VelibStationStatus[] | VelibDataMoyenne[], setSelectedStation: React.Dispatch<React.SetStateAction<VelibStationStatus | null>> | React.Dispatch<React.SetStateAction<VelibDataMoyenne | null>>) {
    // VelibDataMoyenne[] has remplissage_moyen and VelibStationStatus[] has date
    if(velib_data.length == 0) return (<></>);

    if ("remplissage_moyen" in velib_data[0]) {
        velib_data = velib_data as VelibDataMoyenne[]
        return velib_data.map((station) => <VelibMarkerMoyenne key={station.stationcode} station={station} setSelectedStation={setSelectedStation as React.Dispatch<React.SetStateAction<VelibDataMoyenne | null>>}></VelibMarkerMoyenne>)
    } else {
        velib_data = velib_data as VelibStationStatus[]
        return velib_data.map((station) => <VelibMarker key={station.stationcode} station={station} setSelectedStation={setSelectedStation as React.Dispatch<React.SetStateAction<VelibStationStatus | null>>}></VelibMarker>)
    }
}

// { velib_data }: { velib_data: VelibStationInformation[] }
export default function VelibMap({ velib_data }: { velib_data: VelibStationStatus[] | VelibDataMoyenne[] }) {
    const [selected_station, setSelectedStation] = React.useState<VelibStationStatus | null>(null)

    React.useEffect(() => {
        if (selected_station) {
            console.log(selected_station)
            redirect("/station/" + selected_station?.stationcode);
        }
    }, [selected_station])

    return (
        <MapContainer center={PARIS_CENTER} zoom={13} scrollWheelZoom={true} style={{ height: 650, width: "70%", borderRadius: "16px" }}>
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MarkerClusterGroup>

                {conditionnelRenderMarker(velib_data, setSelectedStation)}

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