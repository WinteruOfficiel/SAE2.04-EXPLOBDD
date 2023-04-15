import click
from dbConnector import DbConnexion
import os
from os.path import join, dirname
from dotenv import load_dotenv
from utils import populate_static_data, checkEnv, insert_dynamic_data
from colors import Fore, Style

@click.group()
@click.option('--env', default='.env', help='Environnement à utiliser', type=click.Path(exists=True, dir_okay=False, readable=True, resolve_path=True, allow_dash=False, path_type=None))
def cli(env):
    """
    CLI pour la gestion de la base de données
    à chaque démarrage, vérifie que les variables d'environnement sont bien définies et
    vérifie que les tables sont bien créées
    """
    print(env);
    dotenv_path = join(dirname(__file__), env)
    load_dotenv(dotenv_path)
    checkEnv()
    click.echo(Fore.GREEN + "Donnée d'environnement chargées avec succès !" + Style.RESET_ALL);

@cli.command(short_help="Remplit la base de données avec les données statiques")
def initdb():
    populate_static_data()

@cli.command(short_help="Réinitialise la base de données (supprime les données existantes et les recrée)")
def resetdb():
    dbConn = DbConnexion(required_privileges=['DROP', 'CREATE', 'DELETE'])
    dbConn.reset_table()

@cli.command(short_help="Supprime toutes les tables de la base de données (sans recréer les tables)")
def dropdb():
    dbConn = DbConnexion(required_privileges=['DROP'])
    click.echo(Fore.MAGENTA + '---- Suppression des tables ---' + Style.RESET_ALL)
    dbConn.delete_all_table()

@cli.command(short_help="Ajoute des données dynamiques à la base de données")
@click.option('--force', is_flag=True, help='Force l\'insertion des données (change \'INSERT\' en \'INSERT IGNORE\')')
def addData(force):
    print(force)
    insert_dynamic_data(force)

@cli.command(short_help="Crée (ou reset) la table de log")
def initLog():
    dbConn = DbConnexion(required_privileges=['DROP', 'CREATE'])
    dbConn.construct_log_table()

@cli.command(short_help="reset la table de log")
def resetLog():
    dbConn = DbConnexion(required_privileges=['DROP', 'CREATE'])
    dbConn.construct_log_table()

if __name__ == '__main__':
    cli()