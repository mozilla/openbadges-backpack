from django.conf.urls.defaults import *

urlpatterns = patterns('users.views',
    url(r'^$',          'login_or_continue'),
    url(r'^logout/?$',  'logout'),
)
