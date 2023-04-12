import pandas as pd
from dbConnector import DbConnexion
import os
from os.path import join, dirname
from dotenv import load_dotenv
from utils import populate_static_data, checkEnv

dotenv_path = join(dirname(__file__),'..', '.env')
load_dotenv(dotenv_path)

checkEnv()

populate_static_data()