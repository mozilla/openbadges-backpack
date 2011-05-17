from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response
from utils import *
from badges import BADGES
import urllib, urllib2
import json

ISSUE_URL = 'http://backpack.local/api/1.0/issue'

def list_badges(request):
    return render_to_response('list.html', { 'badges': BADGES })

def badge_manifest(request, badge_id=None):
    badge = get_badge_or_404(badge_id)
    response = HttpResponse(json.dumps(badge))
    response['Content-Type'] = "application/x-badge-manifest"
    return response

def issue_badge(request, badge_id=None):
    path = get_external_path(request, badge_id)
    params = urllib.urlencode({'badge': path})
    remote = urllib2.urlopen(ISSUE_URL, params)
    dir(remote)
    return HttpResponse(params)
    
        
