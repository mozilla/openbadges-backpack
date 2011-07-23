import re
import json
from urllib import urlopen
from django.core.exceptions import ValidationError
from django.core.validators import MinLengthValidator, RegexValidator, URLValidator, validate_email
from validators import validate_integer, validate_iso_date, LengthValidator, RelativeURLValidator, MinSizeValidator, TypeValidator, UniquenessValidator
from manager import BadgeManager

class Badge(object):
    from connection import collection
    objects = BadgeManager()

    def __init__(self, data):
        # required fields
        self.fields = {
            'url':'',
            'name':'',
            'description':'',
            'recipient':'',
            'evidence':'',
            'image':'',
            'groups': [],
            'private': True,
        }
        self.fields.update(data)
        self._errors = {}

    def __eq__(self, other):
        return self.fields == other.fields
    
    def __getitem__(self, key):
        return self.fields.get(key, None)
    
    def __setitem__(self, key, value):
        self.fields[key] = value

    def __contains__(self, item):
        return item in self.fields
        
    def id(self):
        return self['_id']
    
    ######################
    # Validation-related #
    ######################

    field_validators = {
        'url':         [URLValidator()],
        'name':        [LengthValidator(min=4, max=80)],
        'description': [LengthValidator(min=4, max=140)],
        'recipient':   [validate_email],
        'evidence':    [URLValidator()],
        'expires':     [validate_iso_date],
        'image':       [MinLengthValidator(4)],
        'ttl':         [validate_integer],
        'groups':      [TypeValidator(list)],
        'private':     [TypeValidator(bool)],
    }

    unique_validators = [UniquenessValidator('url'),]

    def full_clean(self):
        errors = {}
        try:
            self.clean_fields()
        except ValidationError, e:
            errors = e.update_error_dict(errors)
        if errors:
            raise ValidationError(errors)

        try:
            self.validate_unique()
        except ValidationError, e:
            errors = e.update_error_dict(errors)
        if errors:
            raise ValidationError(errors)

    def validate_unique(self):
        errors = {}
        for validate in self.unique_validators:
            try:
                validate(self)
            except ValidationError, e:
                errors['unique'] = e.messages
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
            if f not in self.field_validators:
                continue
            try:
                for validate in self.field_validators[f]:
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

    #########################
    # Group-related actions #
    #########################

    def add_to_group(self, group):
        existing = set(self.fields.get('groups', []))
        existing.add(group)
        self.fields['groups'] = list(existing)
    
    def groups(self):
        return self.fields['groups']

    def remove_from_group(self, group):
        return self.fields['groups'].remove(group)
    
    ############################
    # Database-hitting actions #
    ############################

    def save(self):
        self.full_clean()
        if self.id():
            return self.__update()
        else:
            return self.__insert()

    def __insert(self):
        objectid = self.collection().insert(self.fields, safe=True)
        if not objectid:
            return False
        self.fields['_id'] = objectid
        return True
    
    def __update(self):
        self.collection().update({'_id':self.fields['_id']}, self.fields, safe=True)
        return True
    
    def delete(self):
        assert self.id() is not None, "Badge object can't be deleted because its _id attribute is set to None"
        self.collection().remove(self.fields['_id'], True)
        del self.fields['_id']

    #################################
    # Verification & remote methods #
    #################################
    def refresh_from_remote(self):
        data = Badge.get_remote_data(self['url'])
        self.fields.update(data)
    
    ##################
    # Static methods #
    ##################
    @staticmethod
    def get_remote_data(url, key=''):
        try:
            URLValidator()(url)
        except ValidationError, e:
            raise ValueError("URL must be valid and absolute.")
        
        raw_re = re.compile('application/x-badge-manifest')
        signed_re = re.compile('application/x-badge-signed')
        response = urlopen(url)
        content_type = response.headers['Content-Type']
        if raw_re.match(content_type):
            data = json.loads(response.read())
            data['url'] = url
        elif signed_re.match(content_type):
            raise NotImplemented("signed badges not yet implemented")
        else:
            raise TypeError("Unrecognized Content-Type for badge (expecting application/x-badge-manifest or application/x-badge-signed, got %s" % content_type)
        return data

    @staticmethod
    def from_remote(url, key=''):
        data = Badge.get_remote_data(url, key)
        return Badge(data)
        
    
