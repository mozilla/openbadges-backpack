from django.conf.urls.defaults import *

urlpatterns = patterns('users.views',
    url(r'^login/?$',                                'login'),
    url(r'^logout/?$',                               'logout'),
    url(r'^register/?$',                             'register'),
    url(r'^confirm/?P<token>\w+/(?P<username>.+)/$', 'confirm'),
)
