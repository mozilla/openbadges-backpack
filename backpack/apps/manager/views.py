from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response
from django.contrib import auth
from django.contrib.auth.decorators import login_required

@login_required
def manage(request):
    return render_to_response('manager.html', { 'user': request.user })
