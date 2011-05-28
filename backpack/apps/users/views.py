# Create your views here.
import urllib

from django.http import HttpResponse, HttpResponseRedirect
from django.template import RequestContext
from django.shortcuts import render_to_response, get_object_or_404
from django.contrib import auth
from django.contrib.auth.models import User
from users.forms import UserCreationForm

def register(request):
    user = getattr(request, 'user', None)
    if user is not None and user.is_active:
        return HttpResponseRedirect('/')
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            new_user = form.save()
            return HttpResponseRedirect('/')
    else:
        form = UserCreationForm()
    return render_to_response('register.html', {'form': form },
                              context_instance=RequestContext(request))

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

    email = request.POST.get('email', '')
    password = request.POST.get('password', '')
    user = auth.authenticate(username=email, password=password)
    if user is not None and user.is_active:
        auth.login(request, user)
        return HttpResponseRedirect('/')
    else:
        return render_to_response('login.html', {'error': True},
                                  context_instance=RequestContext(request))

def confirm(request, token, username):
    user = get_object_or_404(User, username=urllib.unquote(username))
    code = user.get_profile().confirmation_code
    if code == token:
        user.is_active = True
        user.save()
        # TODO: print some sort of message?
        return HttpResponseRedirect('/')
    else:
        return HttpResponse("Invalid token")
