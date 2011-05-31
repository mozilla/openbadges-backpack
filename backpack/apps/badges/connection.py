from pymongo import Connection
from django.conf import settings


class MongoConnection(object):
    connection = None
    def connect(self):
        if not self.connection:
            host = settings.MONGO_DB['HOST']
            port = settings.MONGO_DB['PORT']
            self.connection = Connection(host=(host if host else None), port=(port if port else None))
        return self.connection
    
    def collection(self):
        name = settings.MONGO_DB['NAME']
        return self.connect()[name]['badges']

collection = MongoConnection().collection
