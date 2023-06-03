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


export interface VelibDataMoyenne extends VelibStationInformation {
    remplissage_moyen: number;
    docks_disponibles: number;
    velos_disponibles: number;
    velos_mecaniques_disponibles: number;
    velos_electriques_disponibles: number;
}

export interface StationRemplieStat {
    stationcode: string;
    name: string;
    remplissage: number
}

export interface DataTodayPerStation {
    stationcode: string;
    utcdate: Date;
    is_installed: string;
    numdocksavailable: number;
    numbikesavailable: number;
    mechanical: number;
    ebike: number;
}

export interface deplacementPertinent {
    remplissage_moyen: string;
    name: string;
    stationcode: string;
    station_pleine: string;
    station_pleine_name: string;
    remplissage_station_pleine: string;
    distance: number;
}

export interface fluxTotalData {
    date: Date;
    sumbikesavailable: string;
    sumdocksavailable: string;
    sumebike: string;
    summechanical: string;
}