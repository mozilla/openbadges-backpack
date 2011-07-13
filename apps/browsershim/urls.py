import os
from django.conf.urls.defaults import patterns, include, url

ROOT = os.path.dirname(os.path.abspath(__file__))
path = lambda *a: os.path.join(ROOT, *a)

urlpatterns = patterns('',
    url(r'^(?P<path>.*)$', 'django.views.static.serve',
        { 'document_root': path("files") }
    ),
)
