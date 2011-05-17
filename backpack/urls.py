from django.conf import settings
from django.conf.urls.defaults import patterns, include, url
from django.views.generic.simple import direct_to_template

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$',          direct_to_template, {'template': 'index.html'}),
    url(r'^include/',   include('browsershim.urls')),
    url(r'^admin/',     include(admin.site.urls)),
)

media_url = settings.MEDIA_URL.lstrip('/').rstrip('/')
urlpatterns += patterns('',
    (r'^%s/(?P<path>.*)$' % media_url, 'django.views.static.serve',
     { 'document_root': settings.MEDIA_ROOT }
    ),
)
