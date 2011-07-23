from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from badges.models import Badge

@login_required
def manage(request):
    badges = Badge.objects.filter(recipient=request.user.email)
    return render_to_response('manager.html', { 'user': request.user, 'badges': badges })

