
import mysql.connector
from mysql.connector import errorcode
import os
from enum import Enum
from colorama import Fore, Style
from click import echo

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
            ("date", "DATETIME"),
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
        ],
        "bonuses": [
            "PRIMARY KEY (stationcode, date)"
        ]
    }

    @property
    def columns(self):
        return self.value["columns"]
    
    @property
    def foreign_keys(self):
        return self.value["foreign_key"] if "foreign_key" in self.value else None
    
    @property
    def bonuses(self):
        return self.value["bonuses"] if "bonuses" in self.value else None

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
            echo(Fore.MAGENTA + "--- Initialisation de la connexion à la BDD ---" + Style.RESET_ALL)
            self.debug = os.environ.get("DEBUG") if os.environ.get("DEBUG") else False
            self.db = mysql.connector.connect(
                host=os.environ.get("DB_HOST"),
                user=os.environ.get("DB_USER"),
                password=os.environ.get("DB_PASSWORD"),
                database=os.environ.get("DB_DATABASE_NAME")
            )
            echo(Fore.GREEN + "Connexion à la base de données réussie !" + Style.RESET_ALL)
            echo(Fore.MAGENTA+ "Vérification des tables..." + Style.RESET_ALL)
            self.checkTable()
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
                echo(Fore.RED + "Il y a un problème avec votre nom d'utilisateur ou votre mot de passe" + Style.RESET_ALL)
                SystemExit(-1);
            elif err.errno == errorcode.ER_BAD_DB_ERROR:
                echo(Fore.RED + "La base de données n'existe pas" + Style.RESET_ALL)
                SystemExit(-1);
            else:
                echo(Fore.RED + err + Style.RESET_ALL)
                SystemExit(-1);

    def checkTable(self):
        cursor = self.db.cursor()

        cursor.execute("SHOW TABLES")

        tables = cursor.fetchall()

        for table in TABLES:
            if (table.name,) not in tables:
                echo(Fore.RED + "La table " + table.name + " n'existe pas..." + Style.RESET_ALL)
                self.create_table(table)
            else:
                echo(Fore.GREEN+ "La table " + table.name + " existe" + Style.RESET_ALL)

    def reset_table(self):
        echo(Fore.MAGENTA+ '--- Réinitialisation de la base de données ---' + Style.RESET_ALL)
        echo(Fore.MAGENTA + "Suppression de toutes les tables existantes..." + Style.RESET_ALL)
        self.delete_all_table()

        echo(Fore.MAGENTA+ "Création des tables..." + Style.RESET_ALL)
        for table in TABLES:
            self.create_table(table)

    def delete_all_table(self):
        cursor = self.db.cursor()

        cursor.execute("SHOW TABLES")

        tables = cursor.fetchall()

        #echo(Fore.MAGENTA + "--- Suppression de toutes les tables existantes ---" + Style.RESET_ALL)

        for table in tables:
            echo(Fore.LIGHTRED_EX + "Suppression de la table " + table[0] + "..." + Style.RESET_ALL)

            # delte foreign key
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            
            cursor.execute("DROP TABLE " + table[0])
        
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

    def create_table(self, table: TABLES):

        table_name = table.name
        columns = table.columns

        echo(f"{Fore.CYAN}Création de la table {table_name}... {Style.RESET_ALL}")

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
        
        if table.bonuses != None:
            for bonus in table.bonuses:
                columns_list_str.append(bonus)
        
        query += ", ".join(columns_list_str)
        query += ");"

        cursor = self.db.cursor()

        try:
            if(self.debug == True):
                echo("EXECUTION DE :" + query);
            cursor.execute(query)
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
                echo(Fore.RED + "ERREUR : La table existe déja" + Style.RESET_ALL)
            else:
                echo(Fore.RED + err.msg + Style.RESET_ALL)
        else:
            echo(Fore.GREEN + "OK." + Style.RESET_ALL)
        



        

