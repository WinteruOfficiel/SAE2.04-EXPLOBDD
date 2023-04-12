import pandas as pd
import click
from dbConnector import DbConnexion
import os
from os.path import join, dirname
from dotenv import load_dotenv
from utils import populate_static_data, checkEnv, insert_dynamic_data
from colorama import Fore, Style

dotenv_path = join(dirname(__file__),'..', '.env')
load_dotenv(dotenv_path)
checkEnv()
click.echo(Fore.GREEN + "Donnée d'environnement chargées avec succès !" + Style.RESET_ALL);

@click.group()
def cli():
    """
    CLI pour la gestion de la base de données
    à chaque démarrage, vérifie que les variables d'environnement sont bien définies et
    vérifie que les tables sont bien créées
    """
    pass

@cli.command(short_help="Remplit la base de données avec les données statiques")
def initdb():
    populate_static_data()

@cli.command(short_help="Réinitialise la base de données (supprime les données existantes et les recrée)")
def resetdb():
    dbConn = DbConnexion()
    dbConn.reset_table()

@cli.command(short_help="Supprime toutes les tables de la base de données (sans recréer les tables)")
def dropdb():
    dbConn = DbConnexion()
    click.echo(Fore.MAGENTA + '---- Suppression des tables ---' + Style.RESET_ALL)
    dbConn.delete_all_table()

@cli.command(short_help="Ajoute des données dynamiques à la base de données")
def addData():
    insert_dynamic_data()

if __name__ == '__main__':
    cli()