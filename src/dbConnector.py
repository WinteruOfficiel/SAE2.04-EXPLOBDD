
import mysql.connector
from mysql.connector import errorcode
import os
from enum import Enum

class TABLES(Enum):
    station_information = {
        "columns": [
            ("stationcode", "VARCHAR(5)", True),
            ("name", "VARCHAR(255)"),
            ("capacity", "INT"),
            ("coordonnees_geo", "POINT")
        ] 
    }
    station_status = {
        "columns": [
            # (nom, type, (Foreign Key (table, colonne)))
            ("stationcode", "VARCHAR(5)", ),
            # name (redondant)
            ("is_installed", "VARCHAR(3)"),
            ("numdocksavailable", "INT"),
            ("numbikesavailable", "INT"),
            ("mechanical", "INT"),
            ("ebike", "INT"),
            #("is_renting", "VARCHAR(3)"),
            #("is_returning", "VARCHAR(3)"),
            #("duedate", "DATETIME"),
            #("coordonnees_geo", "geo_point_2d"),
            ("nom_arrondissement_communes", "VARCHAR(255)"),
            # code_insee_commune  (pas utile)
        ],
        "foreign_key": [
            # (nom_clé_origin, nom_table_ref, non_clé_table_ref, on_delete, on_update)
            ("stationcode", "station_information", "stationcode", "CASCADE", "CASCADE")
        ]
    }

    @property
    def columns(self):
        return self.value["columns"]
    
    @property
    def foreign_keys(self):
        return self.value["foreign_key"] if "foreign_key" in self.value else None

class Singleton(type):
    _instances = {}
    # lorsque la metaclass est appelée
    def __call__(cls, *args, **kwargs): # cls = Nom de la classe, *args = liste des arguments, **kwargs = liste des arguments nommés
        if cls not in Singleton._instances:
            Singleton._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return Singleton._instances[cls]

class DbConnexion(metaclass=Singleton):
    def __init__(self):
        try:
            self.db = mysql.connector.connect(
                host=os.environ.get("DB_HOST"),
                user=os.environ.get("DB_USER"),
                password=os.environ.get("DB_PASSWORD"),
                database=os.environ.get("DB_DATABASE_NAME")
            )
            print("Connexion à la base de données réussie") 
            self.checkTable()
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
                print("Il y a un problème avec votre nom d'utilisateur ou votre mot de passe")
                SystemExit(-1);
            elif err.errno == errorcode.ER_BAD_DB_ERROR:
                print("La base de données n'existe pas")
                SystemExit(-1);
            else:
                print(err)
                SystemExit(-1);

    def checkTable(self):
        print("\033[35m--- Vérification des tables ---\033[0m")
        cursor = self.db.cursor()

        cursor.execute("SHOW TABLES")

        tables = cursor.fetchall()

        for table in TABLES:
            if (table.name,) not in tables:
                print("\033[31mLa table " + table.name + " n'existe pas...\033[0m", end="\n\n")
                self.create_table(table)
            else:
                print("\033[32mLa table " + table.name + " existe\033[0m", end="\n\n")

    def reset_table(self):
        print('Réinitialisation de la base de données...')
        self.delete_all_table()

        print("Création des tables...")
        for table in TABLES:
            self.create_table(table)

    def delete_all_table(self):
        cursor = self.db.cursor()

        cursor.execute("SHOW TABLES")

        tables = cursor.fetchall()

        print("Suppression de toutes les tables existantes...")

        for table in tables:
            print("Suppression de la table " + table[0] + "...")

            # delte foreign key
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            
            cursor.execute("DROP TABLE " + table[0])
        
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

    def create_table(self, table: TABLES):
        print(table)
        print(table.columns)

        table_name = table.name
        columns = table.columns

        query = "CREATE TABLE " + table_name + " ("

        columns_list_str = []
        for column in columns:
            columns_str = column[0] + " " + column[1] + " NOT NULL"

            if(len(column) > 2 and column[2]):
                columns_str += " PRIMARY KEY"

            columns_list_str.append(columns_str)

        foreign_keys = table.foreign_keys

        if(foreign_keys != None):
            for foreign_key in foreign_keys:
                columns_str = f"CONSTRAINT `fk_{foreign_key[0]}` "
                columns_str += f"FOREIGN KEY ({foreign_key[0]}) " 
                columns_str += f"REFERENCES {foreign_key[1]} ({foreign_key[2]}) "
                columns_str += f"ON DELETE {foreign_key[3] if len(foreign_key) > 2 else 'RESTRICT' } "
                columns_str += f"ON UPDATE {foreign_key[4] if len(foreign_key) > 3 else 'RESTRICT'}"
                columns_list_str.append(columns_str)
        
        query += ", ".join(columns_list_str)
        query += ");"

        cursor = self.db.cursor()

        try:
            print(f"Création de la table {table_name}...")
            print("EXECUTION DE :", query);
            cursor.execute(query)
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
                print("ERREUR : La table existe déja")
            else:
                print(err.msg)
        else:
            print("OK.")
        



        

