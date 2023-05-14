/*
* Ce fichier est une version modifiée du package npm react-leaflet-markercluster (https://github.com/yuzhva/react-leaflet-markercluster)
* Ce package a été déprécié et n'est plus maintenu depuis 2 ans. je l'ai donc modifié pour qu'il fonctionne avec la dernière version de react-leaflet.
* De plus, je l'ai aussi convertis en typescript.
*/

import { createPathComponent } from '@react-leaflet/core';
import L from 'leaflet';

require('leaflet.markercluster');

type propTypes = string | boolean | L.PathOptions | L.LeafletEventHandlerFnMap;

type ClusterProps = {
    [key: string]: string | boolean | L.PathOptions;
};

type ClusterEvents = {
    [key: string]: L.LeafletEventHandlerFn;
};

const MarkerClusterGroup = createPathComponent(
    ({ children: _c, ...props }, ctx) => {
        const clusterProps: ClusterProps = {};
        const clusterEvents: ClusterEvents = {};

        // Splitting props and events to different objects
        Object.entries(props).forEach(([propName, prop]) =>
            propName.startsWith('on')
                ? (clusterEvents[propName] = prop as L.LeafletEventHandlerFn)
                : (clusterProps[propName] = prop as string | boolean | L.PathOptions)
        );

        // Creating markerClusterGroup Leaflet element
        const markerClusterGroup: L.MarkerClusterGroup = L.markerClusterGroup(clusterProps) as L.MarkerClusterGroup;

        // Initializing event listeners
        Object.entries(clusterEvents).forEach(([eventAsProp, callback]) => {
            const clusterEvent = `cluster${eventAsProp.substring(2).toLowerCase()}`;
            markerClusterGroup.on(clusterEvent, callback);
        });

        return {
            instance: markerClusterGroup,
            context: { ...ctx, layerContainer: markerClusterGroup },
        };
    }
);

export default MarkerClusterGroup;