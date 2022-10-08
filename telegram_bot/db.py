from pymongo import MongoClient
from ssl import CERT_NONE

client = MongoClient("mongodb+srv://wurg:wurg@pythonacademy-9pn3o.gcp.mongodb.net/test?retryWrites=true",ssl=True,ssl_cert_reqs=CERT_NONE)
db = client.get_database('test_db_for_me')