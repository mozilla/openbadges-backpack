from django.conf.urls.defaults import *
from django.views.generic.simple import direct_to_template

urlpatterns = patterns('mock.views',
  url(r'^$',                                 'list_badges'),
  url(r'^badge/(?P<badge_id>.+).badge$',     'badge_manifest'),
  url(r'^issue/(?P<badge_id>.+).badge$',     'issue_badge'),
)
