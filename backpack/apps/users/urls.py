from django.conf.urls.defaults import *

urlpatterns = patterns('users.views',
    url(r'^$',          'login_or_continue'),
    url(r'^login/?$',   'login'),
    url(r'^logout/?$',  'logout'),
)
