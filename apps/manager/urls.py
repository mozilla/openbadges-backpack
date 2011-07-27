from django.conf.urls.defaults import *
from manager import views

urlpatterns = patterns('manager.views',
    url(r'^$',          'manage'),
    url(r'_status',     'status'),
)
