from django.conf.urls.defaults import *

urlpatterns = patterns('mock.views',
  url(r'^badge/(?P<badge_id>.+).badge$',     'badge_manifest'),
)
