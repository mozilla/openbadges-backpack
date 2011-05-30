import re
from pymongo import Connection
from django.conf import settings
from django.core.validators import email_re
from django.core.exceptions import ValidationError


class Badge(object):
    collection = None

    def __init__(self, data):
        if not self.collection: self.collection = connect_to_db()
        # required fields
        self.data = {
            'name':'', 'description':'',
            'recipient':'', 'evidence':'', 'icons':{},
        }
        self.data.update(data)
        self.validator = self.Validator()
        self.errors = []

    def clean(self):
        data = self.data
        for field in data:
            data[field] = self.get_validator(field)(data[field])

    def get_validator(self, field):
        """
        Get validator function for field.
        If no validator exists, returns truth function.
        """
        return getattr(self.validator, field, lambda *a: True)

    def is_valid(self):
        try:
            self.clean()
        except ValidationError:
            return False
        return True

    class Validator(object):
        invalid_uri_re = re.compile(r'^(\w*)://')
        iso_date_re = re.compile(r'^\d{4}(-|/)?\d{1,2}(-|/)?\d{1,2}$')

        def name(self, value): return self.__non_blank(value, 'name');
        def description(self, value): return self.__non_blank(value, 'description');
        def recipient(self, value):
            value = self.__non_blank(value, 'recipient')
            if not email_re.match(value):
                raise ValidationError('recipient must be a valid email address')
            return value
        def evidence(self, value):
            value = self.__non_blank(value, 'evidence')
            if self.invalid_uri_re.match(value):
                raise ValidationError('evidence must be a relative url')
            return value
        def expires(self, value):
            value = self.__non_blank(value, 'expires')
            if not self.iso_date_re.match(value):
                raise ValidationError('expires must be in ISO date format (YYYY-MM-DD)')
            return value
        def ttl(self, value):
            try: value = int(value)
            except ValueError:
                raise ValidationError('ttl must be a valid integer')
            return value
        def icons(self, value):
            try:
                if not len(value.keys()) > 0:
                    raise ValidationError('icons must contain at least one value')
            except AttributeError:
                raise ValidationError('icons must be a dictionary-like object')
            return value

        def __non_blank(self, value, field):
            value = value.strip()
            if not re.match(r'.+', value):
                raise ValidationError('%s cannot be blank' % field)
            return value


def connect_to_db():
    host = settings.MONGO_DB['HOST']
    port = settings.MONGO_DB['PORT']
    name = settings.MONGO_DB['NAME']

    conn = Connection(host=(host if host else None), port=(port if port else None))
    return conn[name].badges
