import urllib
import random
import string

from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.ForeignKey(User, null=True, editable=False, blank=True)
    confirmation_code = models.CharField(max_length=255, default='', blank=True)

    def __unicode__(self):
        return self.user.username

    def generate_confirmation_code(self, regen=False):
        if not self.confirmation_code or regen:
            self.confirmation_code = ''.join(random.sample(string.letters +
                                                           string.digits, 60))
        return self.confirmation_code
