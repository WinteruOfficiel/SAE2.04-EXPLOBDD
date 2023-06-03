import { VelibStationStatus } from '../types/velib_data';
import { MapContainer, TileLayer } from 'react-leaflet';



// this is a "barrel file" that prevents the ClientMap from ever getting loaded in the server.
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import { LatLngExpression } from 'leaflet';
import VelibMarker from './VelibMarkerComponent';
import { GeoJSON } from 'react-leaflet';
import React from 'react';

async function getGeojson() {
    const geojson = await fetch(`${process.env.NEXT_PUBLIC_HOST}/arrondissements2.geojson`)
    console.log("geojson")
    console.log(`${process.env.NEXT_PUBLIC_HOST}/arrondissements.geojson`)
    return await geojson.json()
}

// { velib_data }: { velib_data: VelibStationInformation[] }
export default function VelibMapUneStation({ velib_data }: { velib_data: VelibStationStatus }) {
    const [geojson, setGeojson] = React.useState(null)

    React.useEffect(() => {
        getGeojson().then((geojson) => setGeojson(geojson))
    }, [])

    return (
        <MapContainer center={[velib_data.coordonnees_geo.y, velib_data.coordonnees_geo.x]} zoom={13} scrollWheelZoom={true} style={{ height: 300, width: "40%", borderRadius: "16px" }}>
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {geojson && (geojson as any).features.map((feature: any) => <GeoJSON key={feature.properties.code} data={feature} style={{ fillOpacity: 0.1, lineCap: "round", lineJoin: "round", color: "#000000", weight: 1 }}></GeoJSON>)}
            <VelibMarker station={velib_data} setSelectedStation={() => { }} />
        </MapContainer>
    )


}