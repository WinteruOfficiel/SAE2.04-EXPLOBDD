
import mysql.connector
from mysql.connector import errorcode
import os
from colors import Fore, Style
from click import echo
from tableDefinition import TABLES, log_table, build_table_query
from SingletonMetaclass import Singleton
from cursorContext import cursorContext
import re
import sys

class DbConnexion(metaclass=Singleton):
    """
    Cette classe permet de gérer la connexion à la base de données et les interactions avec celle-ci

    Elle utilise le design pattern Singleton pour s'assurer qu'il n'y a qu'une seule instance de la classe 
    donc qu'une seule connexion à la base de données
    """
    def __init__(self, required_privileges=[]):
        """
        Constructeur de la classe

        il initialise la connexion à la base de données et vérifie que les tables sont bien créées

        En cas d'erreur, il affiche un message d'erreur et quitte le programme

        Les fonctions ne sont pas beaucoup commentées car il y'a déjà beaucoup de print qui sont déjà assez explicites
        """
        try:
            echo(Fore.MAGENTA + "--- Initialisation de la connexion à la BDD ---" + Style.RESET_ALL)

            # récupération de la variable d'environnement DEBUG
            # si elle n'est pas définie, on considère que le mode debug est désactivé, sinon on prend sa valeur qu'on convertit en booléen
            # TODO: trouver une meilleure solution pour le mode debug
            self.debug = (True if os.environ.get("DEBUG") == "True" else False) if os.environ.get("DEBUG") else False
            self.db = mysql.connector.connect(
                host=os.environ.get("DB_HOST"),
                user=os.environ.get("DB_USER"),
                password=os.environ.get("DB_PASSWORD"),
                database=os.environ.get("DB_DATABASE_NAME")
            )


            echo(f"{Fore.GREEN}Connexion à la base de données {self.db.database} réussie !{Style.RESET_ALL}")

        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_TABLEACCESS_DENIED_ERROR:
                echo(Fore.RED + 'La vérification des tables a échoué, vérifiez que vous avez les droits nécessaires' + Style.RESET_ALL)
            elif err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
                echo(Fore.RED + "Il y a un problème avec votre nom d'utilisateur ou votre mot de passe" + Style.RESET_ALL)
                sys.exit(-1);
            elif err.errno == errorcode.ER_BAD_DB_ERROR:
                echo(Fore.RED + "La base de données n'existe pas" + Style.RESET_ALL)
                sys.exit(-1);
            else:
                print(err.errno)
                echo(Fore.RED + err.msg + Style.RESET_ALL)
                sys.exit(-1);
    
    @staticmethod
    def verification_method(instance, *args, **kwargs):
        echo(f'{Fore.MAGENTA}--- vérification de la BDD ---{Style.RESET_ALL}')

        echo(f'{Fore.CYAN}ping...{Style.RESET_ALL}')
        try:
            instance.db.ping(reconnect=True, attempts=1, delay=0)
        except mysql.connector.Error as err:
            echo(Fore.RED + err.msg + Style.RESET_ALL)
            sys.exit(-1);
        echo(Fore.GREEN + 'ping réussi' + Style.RESET_ALL)

        echo(f'{Fore.MAGENTA}vérification des permissions...{Style.RESET_ALL}')

        required_privileges = kwargs.get("required_privileges", [])

        # récupération des privilèges de l'utilisateur, sert pour vérifier si l'utilisateur a les droits nécessaires
        # pour effectuer l'action et aussi pour vérifier que les tables sont bien créées
        granted_privilege = instance.get_granted_privileges()

        # walrus operator (:=) permet d'assigner une valeur à une variable et de la retourner
        if (res := instance.check_user_privilege(required_privileges)) and len(res) > 0:
            echo(Fore.RED + f"Vous n'avez pas les permissions nécessaires pour effectuer cette action: {', '.join(res)}" + Style.RESET_ALL)
            sys.exit(-1)
        echo(Fore.GREEN + 'vérification des permissions réussie' + Style.RESET_ALL)

        # vérification des tables
        privilege_missing_for_checking_tables = instance.check_user_privilege({'DROP', 'CREATE'}, granted_privilege=granted_privilege)

        if  len(privilege_missing_for_checking_tables) == 0:
            echo(Fore.MAGENTA+ "Vérification des tables..." + Style.RESET_ALL)
            instance.checkTable()
        else:
            echo(f"{Fore.RED}Vous n'avez pas les permissions nécessaires pour vérifier les tables ({', '.join(list(privilege_missing_for_checking_tables))}), elles ne seront pas vérifiées (cela peut causer des erreurs inattendues){Style.RESET_ALL}")

    def checkTable(self):
        """
        Cette fonction vérifie que les tables sont bien créées

        ne retourne rien, mais affiche des messages d'erreur si les tables ne sont pas créées
        """

        # DRY (Don't Repeat Yourself)
        def verify_and_create_table(tables, table_name, create_function):
            """
            Cette fonction vérifie si la table existe et la crée si elle n'existe pas
            Utile pour éviter la duplication de code par rapport à la table de log
            """
            if (table_name,) not in tables:
                echo(Fore.RED + f"La table {table_name} n'existe pas..." + Style.RESET_ALL)
                create_function()
            else:
                echo(Fore.GREEN + f"La table {table_name} existe" + Style.RESET_ALL)

        with cursorContext(self.db) as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()

            # vérification de la table de log
            verify_and_create_table(tables, log_table["name"], self.construct_log_table)

            # vérification des autres tables
            for table in TABLES:
                verify_and_create_table(tables, table.name, lambda: self.create_tables(table))

    def reset_table(self):
        """
        Cette fonction réinitialise la base de données (sauf la table de log)
        Elle supprime toutes les tables et les recrée (sans remplir les données statiques)

        ne retourne rien
        """
        echo(Fore.MAGENTA+ '--- Réinitialisation de la base de données ---' + Style.RESET_ALL)
        echo(Fore.MAGENTA + "Suppression de toutes les tables existantes..." + Style.RESET_ALL)
        self.delete_all_table()

        echo(Fore.MAGENTA+ "Création des tables..." + Style.RESET_ALL)
        for table in TABLES:
            self.create_tables(table)

    def delete_all_table(self):
        """
        Cette fonction supprime toutes les tables de la base de données (sauf la table de log)

        ne retourne rien
        """
        with cursorContext(self.db) as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()

            # je vais tout supprimer donc pas besoin de vérifier les clés étrangères
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            for table in tables:
                # je ne supprime pas la table de log
                if(table[0] == log_table["name"]):
                    continue
                echo(Fore.LIGHTRED_EX + "Suppression de la table " + table[0] + "..." + Style.RESET_ALL)

                cursor.execute("DELETE FROM " + table[0]) # pour déclencher les triggers
                cursor.execute("DROP TABLE " + table[0])
        
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    
    def construct_log_table(self):
        """
        Cette fonction supprime si elle existe déja la table de log et la recrée
        Elle crée aussi la procédure stockée qui permet de logger les actions

        Les triggers de log sont crée en même temps que les tables (voir la fonction create_tables)

        ne retourne rien
        """
        echo(Fore.MAGENTA + "--- Construction de la table de log ---" + Style.RESET_ALL)

        with cursorContext(self.db) as cursor:
            echo(Fore.LIGHTRED_EX + "Suppression de la table de log si elle existe déja..." + Style.RESET_ALL)
            cursor.execute("DROP TABLE IF EXISTS " + log_table["name"])

            echo(Fore.MAGENTA + "Création de la table de log..." + Style.RESET_ALL)

            query = build_table_query(log_table["name"], log_table["columns"])

            self.create_table(query, cursor)

            echo(Fore.MAGENTA + "Création des triggers de log..." + Style.RESET_ALL)
        
            self.add_trigger(log_table["triggers"], cursor)
    
    def create_tables(self, table: TABLES):
        """
        Cette fonction crée une table
        Elle prend en paramètre une instance de la classe TABLES

        ne retourne rien
        """
        table_name = table.name
        columns = table.columns

        echo(f"{Fore.CYAN}Création de la table {table_name}... {Style.RESET_ALL}")
        query = build_table_query(table_name, columns, table.foreign_keys, table.bonuses)

        with cursorContext(self.db) as cursor:
            self.create_table(query, cursor)

            # ajout des triggers (dont ceux de log)
            if table.triggers != None:
                echo(Fore.MAGENTA + "Ajout des triggers..." + Style.RESET_ALL)
                self.add_trigger(table.triggers, cursor)

    def add_trigger(self, triggers: list[str], cursor):
        """
        Cette fonction ajoute des triggers à une table
        Elle prend en paramètre une liste de triggers et un curseur

        ne retourne rien
        """
        try: 
            for idx, trigger in enumerate(triggers):
                if(self.debug == True):
                    echo("EXECUTION DE :" + trigger);
                
                cursor.execute(trigger)
                echo(f"{Fore.GREEN}OK ({idx+1}/{len(triggers)})  - {get_name_from_statement(trigger)}{Style.RESET_ALL}")
        except mysql.connector.Error as err:
            echo(Fore.RED + err.msg + Style.RESET_ALL)

    def insert_bulk(self, query: str, data: list[tuple], rollback=True, raiseMysqlError=False):
        """
        Cette fonction permet d'insérer plusieurs données dans la base de données
        Elle prend en paramètre une requête SQL et une liste de tuples

        ne retourne rien
        """
        with cursorContext(self.db) as cursor:
            try:
                cursor.executemany(query, data)
            except mysql.connector.Error as err:
                if raiseMysqlError:
                    raise err
            except Exception as e:
                echo(Fore.RED + "Erreur lors de l'insertion des données : " + str(e) + Style.RESET_ALL)
                if rollback:
                    self.db.rollback()
            else:
                echo(Fore.GREEN + "Insertion des données réussie" + Style.RESET_ALL)
        
        return cursor.rowcount
    
    def create_table(self, query: str, cursor):
        """
        Cette fonction crée une table
        Elle prend en paramètre une requête SQL et un curseur

        ne retourne rien
        """
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

    def get_granted_privileges(self) -> set[str]:
        query = 'SHOW GRANTS;'
        db_name_regex = r"ON [`']?(.*?)[`']?\.\*"
        privilege_name_regex = r"GRANT (.*?) ON"

        granted_privilege = set();
        with cursorContext(self.db) as cursor:
            cursor.execute(query)
            grants = cursor.fetchall()
            for grant in grants:
                db_name_match = re.search(db_name_regex, grant[0])
                privilege_name_match = re.search(privilege_name_regex, grant[0])
                if db_name_match and privilege_name_match:
                    if db_name_match.group(1) == self.db.database:
                        granted_privilege.update(privilege_name_match.group(1).replace(' ', '').split(','))
        
        return granted_privilege
    
    def check_user_privilege(self, required_privilege: set[str], granted_privilege=None) -> set[str]:
        """
        Cette fonction vérifie les privilèges de l'utilisateur connecté à la base de données
        Elle prend en paramètre une liste de privilèges requis
        elle vérifie toujours les privilèges SELECT, INSERT, TRIGGER et EXECUTE (nécessaires pour le fonctionnement du programme, triggers)

        Elle retourne une liste de privilèges manquants
        """
        if granted_privilege == None:
            granted_privilege = self.get_granted_privileges()

        required_privilege = {privilege.upper() for privilege in required_privilege}

        #required_privilege.update({"SELECT", "INSERT", "TRIGGER", "EXECUTE"})

        if self.debug:
            print('required_privilege :')
            print(required_privilege)

        if self.debug:
            print('granted_privilege :')
            print(granted_privilege)
        
        if "ALLPRIVILEGES" in granted_privilege:
            return set()
        elif "ALL" in granted_privilege:
            return set()
        else:
            return required_privilege - granted_privilege
        


def get_name_from_statement(statement: str) -> str:
    """
    Cette fonction extrait le nom d'une procédure ou d'un trigger à partir d'une requête SQL
    """
    pattern = r"(?:CREATE\sOR\sREPLACE\s)(?:TRIGGER|PROCEDURE)\s(\w+)"
    match = re.search(pattern, statement, re.IGNORECASE)

    if match:
        return match.group(1)
    else:
        return "ERR"