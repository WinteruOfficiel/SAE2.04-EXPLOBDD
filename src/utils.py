from dbConnector import DbConnexion, TABLES
import pandas as pd
import os

def populate_static_data():
    dbConn = DbConnexion()
    print('\033[35m---- Enregistrement des données statiques ---\033[0m')

    data = pd.read_json("https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-emplacement-des-stations/exports/json?lang=fr&timezone=Europe%2FBerlin")

    data[['lon', 'lat']] = data['coordonnees_geo'].apply(lambda x: pd.Series([x['lon'], x['lat']]))

    cursor = dbConn.db.cursor()

    # truncate old data
    print("\033[31mSuppression des données existantes...\033[0m")
    cursor.execute(f"DELETE FROM {TABLES.station_information.name}")

    query = """
    INSERT INTO station_information (stationcode, name, capacity, coordonnees_geo) 
    VALUES (%s, %s, %s, ST_GEOMFROMTEXT('POINT(%s %s)'))
    """

    # put the data in the database
    print("\033[36mInsertion des données....\033[0m")

    # convert the data to a list of tuples
    data = data[['stationcode', 'name', 'capacity', 'lon', 'lat']].values.tolist()
    try:
        cursor.executemany(query, data)
    except Exception as e:
        print(e)
        dbConn.db.rollback()

    dbConn.db.commit()

    print("\033[32mDonnées insérées avec succès !\033[0m")

    cursor.close()

mandatoryKeys = [
    "DB_HOST",
    "DB_USER",
    "DB_DATABASE_NAME",
    "DB_PASSWORD"
]

def checkEnv():
    for key in mandatoryKeys:
        assert key in os.environ, "il manque une variable d'environnement : " + key
    