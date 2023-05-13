export interface VelibStationInformation {
    stationcode: string;
    name: string;
    capacity: number;
    coordonnees_geo: coordonate;
    nom_arrondissement_communes: string;
}

export interface coordonate {
    x: number;
    y: number;
}


export interface VelibStationStatus extends VelibStationInformation {
    date: Date;
    is_installed: string;
    numdocksavailable: number;
    numbikesavailable: number;
    mechanical: number;
    ebike: number;
}
