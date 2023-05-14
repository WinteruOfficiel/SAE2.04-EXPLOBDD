import mysql.connector
from mysql.connector import errorcode
import os
import sys
from colors import Fore, Style
from cursorContext import cursorContext
from tableDefinition import TABLES, log_table
from SingletonMetaclass import Singleton
from cachetools import TTLCache, cached
import re
# Terminal color definitions


class DbConnexion(metaclass=Singleton):
    """
    Cette classe permet de gérer la connexion à la base de données et les interactions avec celle-ci

    Elle utilise le design pattern Singleton pour s'assurer qu'il n'y a qu'une seule instance de la classe 
    donc qu'une seule connexion à la base de données
    """

    def __init__(self, required_privileges={}):
        """
        Constructeur de la classe

        il initialise la connexion à la base de données et vérifie que les tables sont bien créées

        En cas d'erreur, il affiche un message d'erreur et quitte le programme

        Les fonctions ne sont pas beaucoup commentées car il y'a déjà beaucoup de print qui sont déjà assez explicites
        """
        try:
            print(
                Fore.MAGENTA + "--- Initialisation de la connexion à la BDD ---" + Style.RESET_ALL)

            print(os.environ.get("DB_DATABASE_NAME"))

            # récupération de la variable d'environnement DEBUG
            # si elle n'est pas définie, on considère que le mode debug est désactivé, sinon on prend sa valeur qu'on convertit en booléen
            # TODO: trouver une meilleure solution pour le mode debug
            self.debug = (True if os.environ.get("DEBUG") ==
                          "True" else False) if os.environ.get("DEBUG") else False
            self.db = mysql.connector.connect(
                host=os.environ.get("DB_HOST"),
                user=os.environ.get("DB_USER"),
                password=os.environ.get("DB_PASSWORD"),
                database=os.environ.get("DB_DATABASE_NAME"),
                port=os.environ.get("DB_PORT") if os.environ.get(
                    "DB_PORT") else 3306
            )

            print(
                f"{Fore.GREEN}Connexion à la base de données {self.db.database} réussie !{Style.RESET_ALL}")

        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_TABLEACCESS_DENIED_ERROR:
                print(Fore.RED + 'La vérification des tables a échoué, vérifiez que vous avez les droits nécessaires' + Style.RESET_ALL)
            elif err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
                print(
                    Fore.RED + "Il y a un problème avec votre nom d'utilisateur ou votre mot de passe" + Style.RESET_ALL)
                sys.exit(-1)
            elif err.errno == errorcode.ER_BAD_DB_ERROR:
                print(Fore.RED + "La base de données n'existe pas" + Style.RESET_ALL)
                sys.exit(-1)
            else:
                print(err.errno)
                print(Fore.RED + err.msg + Style.RESET_ALL)
                sys.exit(-1)

    @staticmethod
    def verification_method(instance, *args, **kwargs):
        print(f'{Fore.MAGENTA}--- vérification de la BDD ---{Style.RESET_ALL}')

        print(f'{Fore.CYAN}ping...{Style.RESET_ALL}')
        try:
            instance.db.ping(reconnect=True, attempts=1, delay=0)
        except mysql.connector.Error as err:
            print(Fore.RED + err.msg + Style.RESET_ALL)
            sys.exit(-1)
        print(Fore.GREEN + 'ping réussi' + Style.RESET_ALL)

        print(f'{Fore.MAGENTA}vérification des permissions...{Style.RESET_ALL}')

        required_privileges = kwargs.get("required_privileges", [])

        # walrus operator (:=) permet d'assigner une valeur à une variable et de la retourner
        if (res := instance.check_user_privilege(required_privileges)) and len(res) > 0:
            print(
                Fore.RED + f"Vous n'avez pas les permissions nécessaires pour effectuer cette action: {', '.join(res)}" + Style.RESET_ALL)
            sys.exit(-1)
        print(Fore.GREEN + 'vérification des permissions réussie' + Style.RESET_ALL)

        # vérification des tables

        print(Fore.MAGENTA + "Vérification des tables..." + Style.RESET_ALL)

        instance.checkTable()

    def checkTable(self):
        """
        Cette fonction vérifie que les tables sont bien créées

        ne retourne rien, mais affiche des messages d'erreur si les tables ne sont pas créées
        """

        # DRY (Don't Repeat Yourself)
        def verify_table(tables, table_name):
            """
            Cette fonction vérifie si la table existe et la crée si elle n'existe pas
            Utile pour éviter la duplication de code par rapport à la table de log
            """
            if (table_name,) not in tables:
                print(
                    Fore.RED + f"La table {table_name} n'existe pas..." + Style.RESET_ALL)
                print(Fore.RED + f"Elle ne sera pas créée" + Style.RESET_ALL)
                print(
                    Fore.RED + f"Veuillez créer la table {table_name} manuellement ou relancer le script avec les droits nécessaires" + Style.RESET_ALL)
                sys.exit(-1)
            else:
                print(Fore.GREEN +
                      f"La table {table_name} existe" + Style.RESET_ALL)

        with cursorContext(self.db) as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()

            # vérification de la table de log
            verify_table(tables, log_table["name"])

            # vérification des autres tables
            for table in TABLES:
                verify_table(tables, table.name)

    @cached(TTLCache(maxsize=1, ttl=300))
    def get_granted_privileges(self) -> set[str]:
        print(Fore.MAGENTA +
              "Récupération des privilèges de l'utilisateur..." + Style.RESET_ALL)
        query = 'SHOW GRANTS;'
        db_name_regex = r"ON [`']?(.*?)[`']?\.\*"
        privilege_name_regex = r"GRANT (.*?) ON"

        granted_privilege = set()
        with cursorContext(self.db) as cursor:
            cursor.execute(query)
            grants = cursor.fetchall()
            for grant in grants:
                db_name_match = re.search(db_name_regex, grant[0])
                privilege_name_match = re.search(
                    privilege_name_regex, grant[0])
                if db_name_match and privilege_name_match:
                    if db_name_match.group(1) == self.db.database:
                        granted_privilege.update(
                            privilege_name_match.group(1).replace(' ', '').split(','))

        return granted_privilege

    def check_user_privilege(self, required_privilege: set[str]) -> set[str]:
        """
        Cette fonction vérifie les privilèges de l'utilisateur connecté à la base de données
        Elle prend en paramètre une liste de privilèges requis
        elle vérifie toujours les privilèges SELECT, INSERT, TRIGGER et EXECUTE (nécessaires pour le fonctionnement du programme, triggers)

        Elle retourne une liste de privilèges manquants

        Cette fonction utilise un cache pour ne pas avoir à refaire la requête à chaque fois, le cache expire au bout de 5 minutes
        """
        granted_privilege = self.get_granted_privileges()

        required_privilege = {privilege.upper()
                              for privilege in required_privilege}

        # required_privilege.update({"SELECT", "INSERT", "TRIGGER", "EXECUTE"})

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
