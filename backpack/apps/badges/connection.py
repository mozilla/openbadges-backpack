from pymongo import Connection
from django.conf import settings

def connect_to_db():
    host = settings.MONGO_DB['HOST']
    port = settings.MONGO_DB['PORT']
    name = settings.MONGO_DB['NAME']

    conn = Connection(host=(host if host else None), port=(port if port else None))
    return conn[name].badges

collection = connect_to_db()
