import json
from django.http import HttpResponse, Http404
from badges import BADGES

def badge_manifest(request, badge_id=None):
    badge = BADGES.get(badge_id, None)
    if not badge:
        raise Http404('YA DONE GOOFED')
    response = HttpResponse(json.dumps(badge))
    response['Content-Type'] = "application/x-badge-manifest"
    return response

