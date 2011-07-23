from django.core.validators import ValidationError
from django.http import HttpResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from models import Badge
import json

@csrf_exempt
def receive_badge(request):
    json_urls = request.POST.get('urls', None)
    status = 201
    response = {'ok': True}
    mime = 'application/json'
    
    # TODO: make sure urls is passed
    urls = json.loads(json_urls)
    errors = {}
    
    for url in urls:
        try: 
            badge = Badge.from_remote(url)
            badge.save()
            print badge
        except ValueError, e:
            errors[url] = {'error': True}
        except TypeError, e:
            errors[url] = {'error': 'mimetype', 'message': e.message}
        except ValidationError, e:
            errors[url] = {'error': 'validation', 'message': e.message_dict}
    
    print errors
    return HttpResponse('wutlol')
