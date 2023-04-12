from dbConnector import DbConnexion, TABLES
import pandas as pd
import os
from colorama import Fore, Style
from click import echo

def populate_static_data():
    dbConn = DbConnexion()
    echo(Fore.MAGENTA + '---- Enregistrement des données statiques ---' + Style.RESET_ALL)

    data = pd.read_json("https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-emplacement-des-stations/exports/json?lang=fr&timezone=Europe%2FBerlin")

    data[['lon', 'lat']] = data['coordonnees_geo'].apply(lambda x: pd.Series([x['lon'], x['lat']]))

    cursor = dbConn.db.cursor()

    echo(Fore.MAGENTA+ "Suppression des données existantes..." + Style.RESET_ALL)
    cursor.execute(f"DELETE FROM {TABLES.station_information.name}")

    query = """
    INSERT INTO station_information (stationcode, name, capacity, coordonnees_geo) 
    VALUES (%s, %s, %s, ST_GEOMFROMTEXT('POINT(%s %s)'))
    """


    echo(Fore.MAGENTA+ "Insertion des données..." + Style.RESET_ALL)

    # convertis les données en une liste de tuples
    data = data[['stationcode', 'name', 'capacity', 'lon', 'lat']].values.tolist()
    try:
        cursor.executemany(query, data)
    except Exception as e:
        print(e)
        dbConn.db.rollback()

    dbConn.db.commit()

    echo(Fore.GREEN + "Données insérées avec succès !" + Style.RESET_ALL)
    

    cursor.close()

def get_data_from_api():
    data = pd.read_json("https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/exports/json?lang=fr&timezone=Europe%2FBerlin")

    data = data[['stationcode', 'is_installed', 'numdocksavailable', 'numbikesavailable', 'mechanical', 'ebike', 'nom_arrondissement_communes']]

    return data

def insert_dynamic_data():
    dbConn = DbConnexion()
    echo(Fore.MAGENTA + '---- Enregistrement des données dynamiques ---' + Style.RESET_ALL)

    data = get_data_from_api()

    # current date
    data['date'] = pd.to_datetime('now')

    # put date in the first column
    cols = data.columns.tolist()
    cols = ["date"] + cols[:-1]
    data = data[cols] 

    cursor = dbConn.db.cursor()

    query = """
    INSERT INTO station_status (date, stationcode, is_installed, numdocksavailable, numbikesavailable, mechanical, ebike, nom_arrondissement_communes) 
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """

    # put the data in the database
    echo(Fore.MAGENTA+ "Insertion des données..." + Style.RESET_ALL)

    # convert the data to a list of tuples
    data = data.values.tolist()
    try:
        cursor.executemany(query, data)
    except Exception as e:
        print(e)
        dbConn.db.rollback()

    dbConn.db.commit()

    echo(Fore.GREEN + "Données insérées avec succès !" + Style.RESET_ALL)
    

    cursor.close()


mandatoryKeys = [
    "DB_HOST",
    "DB_USER",
    "DB_DATABASE_NAME",
    "DB_PASSWORD"
]

def checkEnv():
    if("DEBUG" not in os.environ):
        os.environ["DEBUG"] = "False"
        return
    for key in mandatoryKeys:
        assert key in os.environ, "il manque une variable d'environnement : " + key
    