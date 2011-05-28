from django.conf import settings
from pymongo import Connection


class Badge(object):
    collection = None
    def __init__(self, badge):
        if not self.collection: Badge.connect_to_db()
        self.badge = badge

    def is_valid(self):
        return True
    
    @staticmethod
    def connect_to_db():
        print 'connecting...'
        
        host = settings.MONGO_DB['HOST']
        port = settings.MONGO_DB['PORT']
        name = settings.MONGO_DB['NAME']
        
        conn = Connection(host=(host if host else None), port=(port if port else None))
        Badge.collection = conn[name].badges


