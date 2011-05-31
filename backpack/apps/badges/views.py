from django.core.validators import ValidationError
from django.http import HttpResponse, HttpResponseForbidden
from models import Badge
import json

def recieve_badge(request):
    url = request.POST['url']
    status = 201
    response = {'ok': True}
    mime = 'application/json'
    try:
        badge = Badge.from_remote(url)
        badge.save()
    
    except ValueError, e:
        # could be one of two things
        response = {'error': True}
        return HttpResponseForbidden(json.dumps(response), mimetype=mime)

    except TypeError, e:
        response = {'error': 'mimetype', 'message': e.message}
        return HttpResponseForbidden(json.dumps(response), mimetype=mime)
    
    except ValidationError, e:
        response = {'error': 'validation', 'message': e.message_dict}
        return HttpResponseForbidden(json.dumps(response), mimetype=mime)
    return HttpResponse(json.dumps(response), mimetype=mime, status=status)
