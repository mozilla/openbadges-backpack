from django.http import HttpResponse, HttpResponseRedirect
from django.contrib import auth
from django.contrib.auth.decorators import login_required

@login_required
def manage(request):
    return HttpResponse('yep, logged in')
