# Create your views here.
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response
from django.contrib import auth

def login_or_continue(request):
    if request.user.is_authenticated():
        return HttpResponse('authed')
    else:
        return HttpResponse('not authed')

def logout(request):
    auth.logout(request)
    return HttpResponseRedirect('/')
