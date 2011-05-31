import re
from pymongo import Connection
from django.conf import settings
from django.core.validators import RegexValidator, URLValidator, validate_email
from validators import validate_integer, validate_iso_date, LengthValidator, RelativeURLValidator, MinSizeValidator, TypeValidator
from django.core.exceptions import ValidationError

class Badge(object):
    collection = None
    validators = {
        'url':         [URLValidator()],
        'name':        [LengthValidator(min=4, max=80)],
        'description': [LengthValidator(min=4, max=140)],
        'recipient':   [validate_email],
        'evidence':    [RelativeURLValidator()],
        'expires':     [validate_iso_date],
        'icons':       [TypeValidator(dict), MinSizeValidator(1)],
        'ttl':         [validate_integer],
    }
    
    def __init__(self, data):
        if not self.collection: self.collection = connect_to_db()
        # required fields
        self.fields = {
            'url':'',
            'name':'',
            'description':'',
            'recipient':'',
            'evidence':'',
            'icons':{},
        }
        
        self.fields.update(data)
        self._errors = {}

    def full_clean(self):
        errors = {}
        try:
            self.clean_fields()
        except ValidationError, e:
            errors = e.update_error_dict(errors)
        if errors:
            raise ValidationError(errors)

    def clean_fields(self):
        """
        Cleans all fields and raises a ValidationError containing message_dict
        of all validation errors if any occur.
        """
        errors = {}
        for f in self.fields:
            raw_value = self.fields[f]
            if f not in self.validators:
                continue
            try:
                for validate in self.validators[f]:
                    validate(raw_value)
            except ValidationError, e:
                errors[f] = e.messages
        if errors:
            raise ValidationError(errors)
    
    def errors(self):
        self._errors = []
        try:
            self.full_clean()
        except ValidationError, e: 
            self._errors = e.message_dict
        return self._errors

    def is_valid(self):
        return len(self.errors()) == 0

def connect_to_db():
    host = settings.MONGO_DB['HOST']
    port = settings.MONGO_DB['PORT']
    name = settings.MONGO_DB['NAME']

    conn = Connection(host=(host if host else None), port=(port if port else None))
    return conn[name].badges
