from pymongo import Connection
from django.test import TestCase
from django.conf import settings
from models import Badge

def setup_test_database():
    """
    Take the defined name of the database, append _test.
    """
    name = (settings.MONGO_DB['NAME'] + '_test')
    host = settings.MONGO_DB['HOST']
    port = settings.MONGO_DB['PORT']
    CONNECTION = Connection(host=(host if host else None), port=(port if port else None))
    CONNECTION.drop_database(name)

class BasicTests(TestCase):
    def setUp(self):
        self.valid_badge = {
            'url': 'http://localhost/audio.badge',
            'name': 'Audo Expert',
            'description': "For rockin' beats",
            'recipient': 'test@example.com',
            'evidence': '/badges/audio.html',
            'expires': '2020-1-1',
            'icons': {'128': '/images/audio_128.png',},
            'ttl': 60 * 60 * 24,
        }
    
    def test_validation(self):
        missing_recipient_badge = self.valid_badge.copy()
        del missing_recipient_badge['recipient']

        valid = Badge(self.valid_badge)
        missing_recipient = Badge(missing_recipient_badge)

        self.assertTrue(valid.is_valid(), "Valid badge should be valid")
        self.assertFalse(missing_recipient.is_valid(), "Invalid badge should be invalid")

    def test_error_messaging(self):
        missing_recipient_badge = self.valid_badge.copy()
        missing_description_badge = self.valid_badge.copy()
        invalid_expires_badge = self.valid_badge.copy()
        del missing_recipient_badge['recipient']
        del missing_description_badge['description']
        invalid_expires_badge['expires'] = 'jalji12!'
        
        missing_recipient = Badge(missing_recipient_badge)
        missing_description = Badge(missing_description_badge)
        invalid_expires = Badge(invalid_expires_badge)

        self.assertIn('expires', invalid_expires.errors().keys())
        self.assertIn('recipient', missing_recipient.errors().keys())
        self.assertIn('description', missing_description.errors().keys())
        
    def test_save_and_retrieve(self):
        valid = Badge(self.valid_badge)
        self.assertTrue(valid.save())
        
        all_items = Badge.objects.all()
        self.assertEqual(len(all_items), 1)
        self.assertIn(valid, all_items)
        
setup_test_database()

