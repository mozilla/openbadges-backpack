class BadgeManager(object):
    from connection import collection
    def all(self):
        return self.filter()

    def filter(self, **kwargs):
        return self.collection().find(kwargs)
