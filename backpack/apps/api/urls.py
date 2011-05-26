from django.conf.urls.defaults import *
urlpatterns = patterns('api.views',
    # match anything right now
    url(r'^1.0/test$',   'test'),
    url(r'^1.0/issue$',  'issue'),
)

                       
