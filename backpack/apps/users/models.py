import urllib
import random
import string

from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.ForeignKey(User, null=True, editable=False, blank=True)
    confirmation_code = models.CharField(max_length=255, default='', blank=True)
    

