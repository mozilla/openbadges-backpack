from badges import BADGES

def get_badge_or_404(badge_id):
    badge = BADGES.get(badge_id, None)
    if not badge:
        raise Http404('YA DONE GOOFED')
    return badge

def get_external_path(request, badge_id=None, prefix='badge/'):
    get_badge_or_404(badge_id)
    return ''.join(['http://', request.META['HTTP_HOST'], '/', prefix, badge_id, '.badge'])
