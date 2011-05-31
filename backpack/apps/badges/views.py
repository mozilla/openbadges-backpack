from django.http import HttpResponse
import json

def recieve_badge(request):
    response = json.dumps({'wut':'lol'})
    return HttpResponse(response, mimetype='application/json')
