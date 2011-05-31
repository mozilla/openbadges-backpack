class BadgeManager(object):
    from connection import collection
    def all(self):
        return self.collection().find()

