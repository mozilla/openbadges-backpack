# Create your views here.
from django.http import HttpResponse, HttpResponseRedirect
from django.template import RequestContext
from django.shortcuts import render_to_response
from django.contrib import auth

def login_or_continue(request):
    if request.user.is_authenticated():
        return HttpResponse('authed')
    else:
        return render_to_response('login.html', {},
                                  context_instance=RequestContext(request))

def logout(request):
    auth.logout(request)
    return HttpResponseRedirect('/')

def login(request):
    email = request.POST.get('email', '')
    password = request.POST.get('password', '')
    user = auth.authenticate(username=email, password=password)
    if user is not None and user.is_active:
        auth.login(request, user)
        return HttpResponse('logged in, chucklefuck')
    else:
        return HttpResponseRedirect('/')
    
