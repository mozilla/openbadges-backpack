import urllib, urllib2
import json

class BadgeError(RuntimeError): pass

def get_from_url(url, pubkey=None):
    mimetype = {
        'application/x-badge-manifest': json.loads,
        'application/x-badge-encoded':  encoded_badge,
        'application/x-badge-signed':   signed_badge,
    }
    
    response = urllib2.urlopen(url)
    read_method = mimetype.get(response.headers.type, False)
    
    print response
    
    if not read_method:
        raise RuntimeError("Badge is not a valid type.")
    
    badge = read_method(response.read())
    return badge
    
def encoded_badge(data):
    raise BadgeError("not yet implemented")

def signed_badge(data):
    raise BadgeError("not yet implemented")
