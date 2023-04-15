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

def populate_static_data():
    """
    cette fonction permet de récupérer les données statiques depuis l'API et de les insérer dans la base de données

    Elle supprime les données existantes avant d'insérer les nouvelles données

    ne retourne rien
    """
    dbConn = DbConnexion(['DELETE'])
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
    
    dbConn.insert_bulk(query, data)

    dbConn.db.commit()

    cursor.close()

def get_data_from_api():
    """
    Cette fonction récupère les données dynamiques depuis l'API
    Et ne garde que les colonnes qui nous intéressent
    """
    data = pd.read_json("https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/exports/json?lang=fr&timezone=Europe%2FBerlin")

    data = data[['stationcode', 'is_installed', 'numdocksavailable', 'numbikesavailable', 'mechanical', 'ebike', 'nom_arrondissement_communes', 'duedate']]

    return data

def insert_dynamic_data(force: bool = False):
    """
    Cette fonction permet d'insérer les données dynamiques dans la base de données
    La date la plus récente presente dans la dataframe (colonne "duedate") est celle qui est enregistrée pour chaque station
    """
    dbConn = DbConnexion(['INSERT'])
    echo(Fore.MAGENTA + '---- Enregistrement des données dynamiques ---' + Style.RESET_ALL)

    data = get_data_from_api()

    # la date la plus récente
    last_data_date = data['duedate'].max()

    # on supprime la colonne duedate
    data = data.drop(columns=['duedate'])

    query = """
    INSERT {}INTO station_status (date, stationcode, is_installed, numdocksavailable, numbikesavailable, mechanical, ebike, nom_arrondissement_communes) 
    VALUES ('{}', %s, %s, %s, %s, %s, %s, %s)
    """.format('IGNORE ' if force else '', parseDate(last_data_date))

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