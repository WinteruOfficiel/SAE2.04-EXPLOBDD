from dbConnector import DbConnexion, TABLES
from mysql.connector import errorcode
import pandas as pd
import os
from colors import Fore, Style
from click import echo
from datetime import datetime
import pytz
import sys
import mysql.connector

DYNAMIC_DATA_URL = "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/exports/json?lang=fr&timezone=Europe%2FBerlin"
STATIC_DATA_URL = "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-emplacement-des-stations/exports/json?lang=fr&timezone=Europe%2FBerlin"

def populate_static_data():
    """
    cette fonction permet de récupérer les données statiques depuis l'API et de les insérer dans la base de données

    Elle supprime les données existantes avant d'insérer les nouvelles données

    ne retourne rien
    """
    dbConn = DbConnexion({'INSERT', 'TRIGGER'})
    echo(Fore.MAGENTA + '---- Enregistrement des données statiques ---' + Style.RESET_ALL)
    try:
        data = pd.read_json(STATIC_DATA_URL)
        dynamic_data = pd.read_json(DYNAMIC_DATA_URL)
    except Exception as e:
        echo(Fore.RED + f"Impossible de récupérer les données statiques depuis l'API" + Style.RESET_ALL)
        echo(Fore.RED + str(e) + Style.RESET_ALL)
        sys.exit(1)

    dynamic_data = dynamic_data[['stationcode', 'nom_arrondissement_communes']]
    data[['lon', 'lat']] = data['coordonnees_geo'].apply(lambda x: pd.Series([x['lon'], x['lat']]))

    data = data.merge(dynamic_data, on='stationcode', how='left')

    cursor = dbConn.db.cursor()

    query = """
    INSERT INTO station_information (stationcode, name, capacity, coordonnees_geo, nom_arrondissement_communes) 
    VALUES (%s, %s, %s, ST_GEOMFROMTEXT('POINT(%s %s)'), %s)
    ON DUPLICATE KEY UPDATE name = VALUES(name), capacity = VALUES(capacity), coordonnees_geo = VALUES(coordonnees_geo), nom_arrondissement_communes = VALUES(nom_arrondissement_communes)
    """

    echo(Fore.MAGENTA+ "Insertion des données..." + Style.RESET_ALL)

    # convertis les données en une liste de tuples
    data = data[['stationcode', 'name', 'capacity', 'lon', 'lat', 'nom_arrondissement_communes']].values.tolist()
    
    dbConn.insert_bulk(query, data)

    dbConn.db.commit()

    cursor.close()

def get_data_from_api():
    """
    Cette fonction récupère les données dynamiques depuis l'API
    Et ne garde que les colonnes qui nous intéressent
    """
    try:
        data = pd.read_json(DYNAMIC_DATA_URL)
    except Exception as err:
        echo(Fore.RED + "Erreur lors de la récupération des données dynamiques" + Style.RESET_ALL)
        echo(Fore.RED + str(err) + Style.RESET_ALL)
        sys.exit(1)

    data = data[['stationcode', 'is_installed', 'numdocksavailable', 'numbikesavailable', 'mechanical', 'ebike', 'duedate']]

    return data

def insert_dynamic_data(force: bool = False, sqlNowDate = False):
    """
    Cette fonction permet d'insérer les données dynamiques dans la base de données
    La date la plus récente presente dans la dataframe (colonne "duedate") est celle qui est enregistrée pour chaque station
    """
    dbConn = DbConnexion({'INSERT', 'TRIGGER', 'SELECT'})
    echo(Fore.MAGENTA + '---- Enregistrement des données dynamiques ---' + Style.RESET_ALL)
    echo(f"{Fore.CYAN}La méthode pour trouver la date est : {'SQL NOW()' if sqlNowDate else 'La date la plus récente dans la dataframe'}{Style.RESET_ALL}")

    data = get_data_from_api()

    last_data_date = None
    if not sqlNowDate:
        data['duedate'] = pd.to_datetime(data['duedate'])

        # la date la plus récente
        last_data_date = data['duedate'].max()

        print(last_data_date)

    # on supprime la colonne duedate
    data = data.drop(columns=['duedate'])

    query = """
    INSERT {}INTO station_status (date, stationcode, is_installed, numdocksavailable, numbikesavailable, mechanical, ebike) 
    VALUES ({}, %s, %s, %s, %s, %s, %s)
    """

    if sqlNowDate:
        query = query.format('IGNORE ' if force else '', 'UTC_TIMESTAMP()');
    else:
        query = query.format('IGNORE ' if force else '', f'\'{parseDate(str(last_data_date))}\'')

    echo(Fore.MAGENTA+ "Insertion des données..." + Style.RESET_ALL)

    if(os.environ["DEBUG"] == "True"):
        echo("Requête : " + query);

    # convertion de la dataframe en liste de tuples
    data = data.values.tolist()
    rowcount = -1
    try:
        rowcount = dbConn.insert_bulk(query, data, raiseMysqlError=True)
    except mysql.connector.errors.IntegrityError as e:
        dbConn.db.rollback()
        if e.errno == errorcode.ER_NO_REFERENCED_ROW_2:
            echo(Fore.RED + "Erreur lors de l'insertion des données dynamiques : clé étrangère non présente dans la table station_information" + Style.RESET_ALL)
            echo(Fore.RED + "Cela peut-être du au fait que la table station_information n'est pas à jour ou pas initialisée" + Style.RESET_ALL)
            echo(Fore.RED + "Veuillez lancer le script avec la commande \"initdb\"" + Style.RESET_ALL)
            echo(Fore.RED + "Si jamais vous souhaitez forcer l'insertion des données, veuillez lancer le script avec le paramètre \"--force\"" + Style.RESET_ALL)
            sys.exit(1)
        elif e.errno == errorcode.ER_DUP_ENTRY:
            echo(Fore.RED + "Erreur lors de l'insertion des données dynamiques : clé primaire en doublon" + Style.RESET_ALL)
            echo(Fore.RED + "Cela peut-être du au fait que le fichier de données dynamiques n'a pas été mis à jour depuis la dernière insertion" + Style.RESET_ALL)
            echo(Fore.RED + "Si jamais vous souhaitez forcer l'insertion des données, veuillez lancer le script avec le paramètre \"--force\"" + Style.RESET_ALL)
            sys.exit(1)
        else:
            echo(Fore.RED + "Erreur lors de l'insertion des données dynamiques : " + str(e) + Style.RESET_ALL)
            sys.exit(1)

    if(force):
        echo(Fore.YELLOW + "Nombre de lignes insérées : " + str(rowcount) + Style.RESET_ALL)

    dbConn.db.commit()
    

mandatoryKeys = [
    "DB_HOST",
    "DB_USER",
    "DB_DATABASE_NAME",
    "DB_PASSWORD"
]

def checkEnv():
    """
    Cette fonction vérifie que les variables d'environnement sont bien présentes 
    Elle est appelée au début du programme

    Sans ces variables d'environnement, le programme ne peut pas fonctionner (connexion à la base de données)

    Elle ne retourne rien
    """
    if("DEBUG" not in os.environ):
        os.environ["DEBUG"] = "False"

    for key in mandatoryKeys:
        try: 
            assert key in os.environ, "il manque une variable d'environnement : " + key
        except AssertionError as e:
            echo(Fore.RED + str(e) + Style.RESET_ALL)
            sys.exit(1)
    
def parseDate(date: str) -> str:
    """
    Cette fonction permet de convertir une date au format ISO 8601 en une date au format SQL

    Exemple : 2021-03-01T12:00:00+01:00 -> 2021-03-01T11:00:00
    """
    return datetime.fromisoformat(date).astimezone(pytz.utc).strftime('%Y-%m-%dT%H:%M:%S')