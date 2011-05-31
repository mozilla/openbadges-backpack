from django.http import HttpResponse
from models import Badge
import json

def recieve_badge(request):
    url = request.POST['url']
    status = 201
    response = {'ok': True}
    try:
        Badge.from_remote(url)
    
    except ValueError, e:
        # could be one of two things
        print e.params
        response = {'error': True}
        status = 403

    except TypeError, e:
        print e.params
        response = {'error': 'mimetype', 'message': e.message}
    
    return HttpResponse(json.dumps(response), mimetype='application/json', status=status)
