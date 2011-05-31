import json
from pymongo import Connection
from django.test import TestCase
from django.test.client import Client, RequestFactory
from django.conf import settings
from django.core.exceptions import ValidationError
from testserver.server import server
from models import Badge
import views

def setup_test_database():
    """
    Take the defined name of the database, append _test.
    """
    name = (settings.MONGO_DB['NAME'] + '_test')
    host = settings.MONGO_DB['HOST']
    port = settings.MONGO_DB['PORT']
    CONNECTION = Connection(host=(host if host else None), port=(port if port else None))
    CONNECTION.drop_database(name)
    settings.MONGO_DB['NAME'] = name

valid_badge = {
    'url': 'http://localhost/audio.badge',
    'name': 'Audo Expert',
    'description': "For rockin' beats",
    'recipient': 'test@example.com',
    'evidence': '/badges/audio.html',
    'expires': '2020-1-1',
    'icons': {'128': '/images/audio_128.png',},
    'ttl': 60 * 60 * 24,
}

class BasicTests(TestCase):
    def setUp(self):
        self.valid = Badge(valid_badge)
    
    def test_validation(self):
        missing_recipient_badge = valid_badge.copy()
        del missing_recipient_badge['recipient']
        missing_recipient = Badge(missing_recipient_badge)

        self.assertTrue(self.valid.is_valid(), "Valid badge should be valid")
        self.assertFalse(missing_recipient.is_valid(), "Invalid badge should be invalid")

    def test_error_messaging(self):
        missing_recipient_badge = valid_badge.copy()
        missing_description_badge = valid_badge.copy()
        invalid_expires_badge = valid_badge.copy()
        del missing_recipient_badge['recipient']
        del missing_description_badge['description']
        invalid_expires_badge['expires'] = 'jalji12!'
        
        missing_recipient = Badge(missing_recipient_badge)
        missing_description = Badge(missing_description_badge)
        invalid_expires = Badge(invalid_expires_badge)

        self.assertIn('expires', invalid_expires.errors().keys())
        self.assertIn('recipient', missing_recipient.errors().keys())
        self.assertIn('description', missing_description.errors().keys())
        
class DatabaseTests(TestCase):
    def setUp(self):
        self.valid = Badge(valid_badge)

    def tearDown(self):
        # remove all created badges
        map(lambda b: b.delete(), Badge.objects.all())
    
    def test_save_and_delete(self):
        self.assertRaises(AssertionError, self.valid.delete)
        self.assertTrue(self.valid.save())
        self.assertEqual(Badge.objects.all().count(), 1)
        
        self.valid.delete()
        self.assertEqual(Badge.objects.all().count(), 0)
        self.assertRaises(AssertionError, self.valid.delete)
    
    def test_save_and_retrieve(self):
        self.assertTrue(self.valid.save())
        
        all_items = Badge.objects.all()
        self.assertEqual(all_items.count(), 1)
        
        badge = all_items.next()
        self.assertEqual(self.valid, badge)

    def test_uniqueness_constraint(self):
        self.valid.save()
        dupe = Badge(valid_badge)
        self.assertRaises(ValidationError, dupe.save)
    
    def test_filtering(self):
        other_badge = valid_badge.copy()
        other_badge['url'] = 'http://localhost/other_audio.badge'
        other_badge['recipient'] = 'blurgh@example.com'
        
        self.valid.save()
        Badge(other_badge).save()
        
        badges = Badge.objects.filter(recipient='test@example.com')
        self.assertEqual(badges.count(), 1)
        self.assertEqual(badges.next(), self.valid)

    def test_find_one(self):
        self.valid.save()
        self.assertEqual(self.valid, Badge.objects.get(pk=self.valid.id()))

class GroupingTests(TestCase):
    def setUp(self):
        self.badge = Badge(valid_badge)
        self.badge.save()
    
    def tearDown(self):
        # remove all created badges
        map(lambda b: b.delete(), Badge.objects.all())
    
    def test_add_to_group(self):
        # add to group
        self.badge.add_to_group('linkedin')
        self.badge.save()
        badge_again = Badge.objects.get(pk=self.badge.id())
        self.assertIn('linkedin', badge_again.groups())
        
    def test_remove_from_group(self):
        # remove from group
        map(self.badge.add_to_group, ['facebook', 'myspace'])
        self.badge.save()
        self.badge.remove_from_group('myspace')
        self.badge.save()
        
        badge_again = Badge.objects.get(pk=self.badge.id())
        self.assertNotIn('myspace', badge_again.groups())
        self.assertIn('facebook', badge_again.groups())
    
    def test_invalid_group(self):
        self.badge['groups'] = 'not a list'
        self.assertRaises(ValidationError, self.badge.save)
        self.assertIn('groups', self.badge.errors())

    def test_filter_by_group(self):
        badge2 = Badge(valid_badge.copy())
        badge2['recipient'] = 'person@example.com'
        badge2['url'] = 'http://localhost/yet_another_audio.badge'
        badge2.add_to_group('do-not-find')
        self.badge.add_to_group('find')
        self.badge.add_to_group('linkedin')
        self.badge.add_to_group('other-group')
        self.badge.save()
        badge2.save()

        badges = Badge.objects.filter(groups='find')
        self.assertEqual(badges.count(), 1)
        self.assertIn(self.badge, badges)

class RemoteServerTests(TestCase):
    badge_url = "http://localhost:5000/audio.badge"
    malformed_url = "http://localhost:5000/malformed.badge"
    invalid_url = "http://localhost:5000/invalid_type.badge"
    
    def test_badge_from_uri(self):
        badge = Badge.from_remote(self.badge_url)
        badge.save()
        self.assertEqual(badge['recipient'], 'test@example.com')
        badge.delete()
    
    def test_invalid_type(self):
        self.assertRaises(TypeError, Badge.from_remote, self.invalid_url)
    
    def test_malformed(self):
        self.assertRaises(ValueError, Badge.from_remote, self.malformed_url)

    def test_invalid_url(self):
        self.assertRaises(ValueError, Badge.from_remote, 'not-a-real-uri')
    
    def test_refresh(self):
        badge = Badge.from_remote(self.badge_url)
        original_description = badge['description']
        
        badge.add_to_group('facebook')
        badge['description'] = 'something else'
        badge.save()

        badge.refresh_from_remote()
        self.assertEqual(badge['description'],  original_description)
        self.assertIn('facebook', badge.groups())
        
class ViewTests(TestCase):
    badge_url = "http://localhost:5000/audio.badge"
    malformed_url = "http://localhost:5000/malformed.badge"
    invalid_url = "http://localhost:5000/invalid_type.badge"
    
    def setUp(self):
        self.client = Client()
        self.factory = RequestFactory()

    def test_issue_view(self):
        request = self.factory.post('/badge/issue',{'url': self.badge_url})
        response = views.recieve_badge(request)
        respobj = json.loads(response.content)
        
        self.assertIs(response.status_code, 201, "Wrong HTTP status for creating badge (should be 201)")
        self.assertIs(respobj['ok'], True, "Response should contain an 'ok' element")

        # play it again, sam
        # response = views.recieve_badge(request)
        # self.assertIs(response.status_code, 403, "Wrong HTTP status for creating duplicated badge (should be 403)")
        
        
setup_test_database()
server.start() # starts on port 5000 -- see testserver/server.py, line 24


