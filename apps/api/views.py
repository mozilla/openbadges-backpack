from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import badges
import urllib, urllib2
import json

@csrf_exempt
def test(request):
    return HttpResponse(json.dumps({'status':'working'}))

@csrf_exempt
def issue(request):
    if not request.method == "POST":
        return HttpResponse(json.dumps({'error':'issue must be called by POST'}))
    path = request.POST.get('badge', '')
    if not path:
        return HttpResponse(json.dumps({'error':'badge path seems to be invalid'}))
        
    response = urllib2.urlopen('http://issuer.local/badge/brian_audio.badge')
    badge = badges.get_from_url(path)
    resp = json.dumps({'got': badge.get('name', '')})
    return HttpResponse(resp)

