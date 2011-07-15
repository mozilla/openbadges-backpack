import urllib
import logging
import json
import logging 

from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect
from django.template import RequestContext
from django.shortcuts import render_to_response, get_object_or_404
from django.contrib import auth
from django.contrib.auth.models import User
from users.forms import UserCreationForm

logger = logging.getLogger(__name__)

def logout(request):
    auth.logout(request)
    return HttpResponseRedirect('/')

def login(request):
    if request.user.is_authenticated():
        # TODO: print some sort of message?
        return HttpResponseRedirect('/')

    if request.method == 'GET':
        return render_to_response('login.html', {},
                                  context_instance=RequestContext(request))

    # get assertion
    assertion_url = 'https://%s/verify?assertion=%s&audience=%s'% (
        settings.IDENTITY_PROVIDER,
        request.POST.get('assertion', ''),
        settings.SITE_URL)
    
    assertion = json.loads(urllib.urlopen(assertion_url).read())
    
    # validate assertion
    identity_provider = '%s:443' % settings.IDENTITY_PROVIDER
    valid_response = (assertion['status'] == 'okay')
    expected_provider = (assertion['issuer'] == identity_provider)
    if valid_response and expected_provider:
        email = assertion['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist, e:
            user = User(username=hash(email), email=email)
            user.save()
        
        user.backend = 'django.contrib.auth.backends.ModelBackend'
        auth.login(request, user)
        return HttpResponseRedirect('/')
    
    else:
        logger.error('invalid assertion')
    
    return render_to_response('login.html', {'error': True,},
                              context_instance=RequestContext(request))
