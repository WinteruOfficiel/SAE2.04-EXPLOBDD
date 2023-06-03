import { VelibDataMoyenne, VelibStationStatus } from '../types/velib_data';
import { LayersControl, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from './MarkerClusterGroup';
import * as turf from '@turf/turf';

const PARIS_CENTER: LatLngExpression = [48.856, 2.352]


// this is a "barrel file" that prevents the ClientMap from ever getting loaded in the server.
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import { LatLngExpression } from 'leaflet';
import VelibMarker from './VelibMarkerComponent';
import VelibMarkerMoyenne from './VelibMarkerMoyenne';
import { GeoJSON } from 'react-leaflet';
import React from 'react';
import { redirect } from 'next/navigation';


function conditionnelRenderMarker(velib_data: VelibStationStatus[] | VelibDataMoyenne[], setSelectedStation: React.Dispatch<React.SetStateAction<VelibStationStatus | null>> | React.Dispatch<React.SetStateAction<VelibDataMoyenne | null>>) {
    // VelibDataMoyenne[] has remplissage_moyen and VelibStationStatus[] has date
    if (velib_data.length == 0) return (<></>);

    if ("remplissage_moyen" in velib_data[0]) {
        velib_data = velib_data as VelibDataMoyenne[]
        return velib_data.map((station) => <VelibMarkerMoyenne key={station.stationcode} station={station} setSelectedStation={setSelectedStation as React.Dispatch<React.SetStateAction<VelibDataMoyenne | null>>}></VelibMarkerMoyenne>)
    } else {
        velib_data = velib_data as VelibStationStatus[]
        return velib_data.map((station) => <VelibMarker key={station.stationcode} station={station} setSelectedStation={setSelectedStation as React.Dispatch<React.SetStateAction<VelibStationStatus | null>>}></VelibMarker>)
    }
}

async function getGeojson() {
    const geojson = await fetch(`${process.env.NEXT_PUBLIC_HOST}/arrondissements2.geojson`)
    console.log("geojson")
    console.log(`${process.env.NEXT_PUBLIC_HOST}/arrondissements.geojson`)
    return await geojson.json()
}

// { velib_data }: { velib_data: VelibStationInformation[] }
export default function VelibMap({ velib_data }: { velib_data: VelibStationStatus[] | VelibDataMoyenne[] }) {
    const [selected_station, setSelectedStation] = React.useState<VelibStationStatus | null>(null)
    const [geojson, setGeojson] = React.useState(null)
    // Map<Arr, VelibStationStatus[]>
    const [stations_arr, setStationsArr] = React.useState(new Map<string, (VelibStationStatus | VelibDataMoyenne)[]>())

    React.useEffect(() => {
        getGeojson().then((geojson) => setGeojson(geojson))
    }, [])


    React.useEffect(() => {
        if (selected_station) {
            console.log(selected_station)
            redirect("/station/" + selected_station?.stationcode);
        }
    }, [selected_station])

    React.useEffect(() => {
        console.log("geojson")
        console.log(geojson)

        if (geojson) {
            const stationsMap = new Map<string, VelibStationStatus[] | VelibDataMoyenne[]>();

            const featureCollection = turf.featureCollection((geojson as any).features);

            velib_data.forEach((station) => {
                const point = turf.point([station.coordonnees_geo.x, station.coordonnees_geo.y]);

                const containingPolygon = featureCollection.features.find((polygon) => {
                    return turf.booleanPointInPolygon(point, polygon as any);
                });

                const arrondissement = containingPolygon?.properties?.c_ar || "Autres"; // Remplacez "arrondissement" par le nom de la propriété correspondant à l'arrondissement dans votre geojson
                if (!stationsMap.has(arrondissement)) {
                    stationsMap.set(arrondissement, []);
                }
                (stationsMap.get(arrondissement) as any).push(station);

            });

            console.log(stationsMap)
            setStationsArr(stationsMap);
        }

    }, [geojson, velib_data]);


    return (
        <MapContainer center={PARIS_CENTER} zoom={13} scrollWheelZoom={true} style={{ height: 650, width: "70%", borderRadius: "16px" }} minZoom={10}>
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {geojson && (geojson as any).features.map((feature: any) => <GeoJSON key={feature.properties.code} data={feature} style={{fillOpacity: 0.1, lineCap: "round", lineJoin: "round", color: "#000000", weight: 1}}></GeoJSON>)}
            <LayersControl position="topright">
                {stations_arr && Array.from(stations_arr.keys()).sort((a: string, b: string) => {
                    if (a == "Autres") return 1;
                    if (b == "Autres") return -1;
                    return parseInt(a) - parseInt(b);
                })
                .map((arrondissement) => {
                    return (
                        <LayersControl.Overlay checked={arrondissement == "Autres"} key={arrondissement} name={arrondissement == "Autres" ? "Hors de Paris" : arrondissement == "1" ? "1er arrondissement" : arrondissement + "ème arrondissement"}>
                            <MarkerClusterGroup>
                                {conditionnelRenderMarker(stations_arr.get(arrondissement) as VelibStationStatus[] | VelibDataMoyenne[], setSelectedStation)}
                            </MarkerClusterGroup>
                        </LayersControl.Overlay>
                    )
                })}
            </LayersControl>

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