class BadgeManager(object):
    from connection import collection
    def all(self):
        return self.filter()
    def filter(self, **kwargs):
        return self.collection().find(kwargs)
    def get(self, **kwargs):
        from models import Badge
        if 'pk' in kwargs:
            kwargs['_id'] = kwargs['pk']
            del kwargs['pk']
        return Badge(self.collection().find_one(kwargs))
