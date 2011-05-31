from pymongo.cursor import Cursor
from pymongo.collection import Collection
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
        """
        Get the badge collection from the database and monkeypatch the
        collection object to use BadgeCursor instead of the regular Cursor.
        """
        name = settings.MONGO_DB['NAME']
        coll = self.connect()[name]['badge']
        
        # override the find method -- see pymongo/collection.py line 478
        coll.find = lambda *a, **k: BadgeCursor(coll, *a, **k)
        return coll 

class BadgeCursor(Cursor):
    """
    Subclass Cursor and override next() to automatically return Badge objects.
    """
    def next(self):
        from models import Badge
        return Badge(super(BadgeCursor, self).next())

collection = MongoConnection().collection
