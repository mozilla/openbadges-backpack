import re
from django.utils.translation import ugettext_lazy as _
from django.core.validators import RegexValidator, MinLengthValidator, MaxLengthValidator, BaseValidator

absolute_url_re = re.compile(r'^\w*:?//')
iso_date_re = re.compile(r'^\d{4}(-|/)?\d{1,2}(-|/)?\d{1,2}$')
validate_iso_date = RegexValidator(iso_date_re, _(u'Must be a valid ISO date (YYYY-MM-DD)'), 'invalid')

class LengthValidator(object):
    def __init__(self, min=0, max=0):
        self.min = min
        self.max = max
    def __call__(self, value):
        MinLengthValidator(self.min)(value)
        MaxLengthValidator(self.max)(value)
        
class MinSizeValidator(MinLengthValidator):
    message = _(u'Ensure this container has at least %(limit_value)d members (it has %(show_value)d).')

class RelativeURLValidator(BaseValidator):
    def __init__(self): self.limit_value = None
    compare = lambda self, a, b: a
    clean   = lambda self, x: absolute_url_re.match(x)
    message = _(u'Ensure this value is a relative url.')
    code = 'relative_url'

class TypeValidator(BaseValidator):
    compare = lambda self, a, b: a is not b
    clean   = lambda self, x: type(x)
    message = _(u'Ensure this value is %(limit_value)s (it is %(show_value)s.')
    code = 'type'

def validate_integer(value):
    try: value = int(value)
    except (ValueError, TypeError), e:
        raise ValidationError('must be valid integer')
    return value

