from telegram.ext import Updater, PicklePersistence
from pathlib import Path
from utils import load_config
from pymongo import MongoClient
from ssl import CERT_NONE

PROJ_ROOT = Path(__file__).parent.parent
conf = load_config(PROJ_ROOT / 'config' / 'config.yml')

INTERNAL_URL = f'http://%s:%s/internal_connection_handler'%(str(conf['host']), str(conf['port']))
TOKEN = conf['bot_token']

pp = PicklePersistence(filename='telegram_bot/data/conversationbot')
updater = Updater(TOKEN, use_context=True, persistence=pp)

client = MongoClient(conf['mongo']['mongo_uri'], ssl=True, ssl_cert_reqs=CERT_NONE)
db = client.get_database(conf['mongo']['database'])