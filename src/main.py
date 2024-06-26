import click
import time
from dbConnector import DbConnexion
import os
from os.path import join, dirname
from dotenv import load_dotenv
from utils import populate_static_data, checkEnv, insert_dynamic_data
from colors import Fore, Style


@click.group()
@click.option('--env', default='.env', show_default=True, help='Environnement à utiliser', type=click.Path(exists=True, dir_okay=False, readable=True, resolve_path=True, allow_dash=False, path_type=None))
@click.option('--debug', is_flag=True, help='Active le mode debug')
def cli(env, debug):
    """
    CLI pour la gestion de la base de données
    à chaque démarrage, vérifie que les variables d'environnement sont bien définies et
    vérifie que les tables sont bien créées
    """
    dotenv_path = join(dirname(__file__), env)
    load_dotenv(dotenv_path)

    if (debug):
        os.environ["DEBUG"] = "True"

    checkEnv()
    click.echo(
        Fore.GREEN + "Donnée d'environnement chargées avec succès !" + Style.RESET_ALL)


@cli.command(short_help="Remplit la base de données avec les données statiques")
def initdb():
    populate_static_data()


@cli.command(short_help="Réinitialise la base de données (supprime les données existantes et les recrée)")
def resetdb():
    dbConn = DbConnexion(required_privileges={
                         'DROP', 'CREATE', 'DELETE', 'TRIGGER', 'INSERT'})
    dbConn.reset_table()


@cli.command(short_help="Supprime toutes les tables de la base de données (sans recréer les tables)")
def dropdb():
    dbConn = DbConnexion(required_privileges={
                         'DROP', 'DELETE', 'TRIGGER', 'INSERT'})
    click.echo(Fore.MAGENTA + '---- Suppression des tables ---' + Style.RESET_ALL)
    dbConn.delete_all_table()


@cli.command(short_help="Ajoute des données dynamiques à la base de données")
@click.option('--force', is_flag=True, help='Force l\'insertion des données (change \'INSERT\' en \'INSERT IGNORE\')')
@click.option('--datemethod', '-d', default='latest', help='Choix entre utiliser la date la plus recente dans la dataframe (latest) et utiliser le méthode now de SQL (SQLNOW)', type=click.Choice(['latest', 'SQLNOW'], case_sensitive=False))
def addData(force, datemethod):
    print(datemethod)
    insert_dynamic_data(
        force, sqlNowDate=True if datemethod.upper() == 'SQLNOW' else False)


@cli.command(short_help="Crée (ou reset) la table de log")
def initLog():
    dbConn = DbConnexion(required_privileges={
                         'DROP', 'CREATE', 'CREATEROUTINE', 'ALTERROUTINE'})
    dbConn.construct_log_table()


@cli.command(short_help="reset la table de log")
def resetLog():
    dbConn = DbConnexion(required_privileges={
                         'DROP', 'CREATE', 'DELETE', 'SELECT', 'CREATEROUTINE', 'ALTERROUTINE'})
    dbConn.construct_log_table()


""" @cli.command(short_help="test")
def test():
    DbConn = DbConnexion(required_privileges={})
    DbConn.get_granted_privileges()
    DbConn.get_granted_privileges()
    DbConn.get_granted_privileges()
    print("sleeping")
    time.sleep(11)
    DbConn.get_granted_privileges()
    DbConn.get_granted_privileges() """


if __name__ == '__main__':
    cli()
