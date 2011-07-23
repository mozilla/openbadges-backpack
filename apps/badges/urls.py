from django.conf.urls.defaults import *
import views

urlpatterns = patterns('',
    url(r'^issue/?$',  views.receive_badge),
)
    
