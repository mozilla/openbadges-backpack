from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def test(request):
    return HttpResponse(json.dumps({'status':'working'}))
