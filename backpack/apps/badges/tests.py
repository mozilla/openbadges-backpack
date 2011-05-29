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
            'name': 'Audo Expert',
            'description': "For rockin' beats",
            'recipient': 'test@example.com',
            'evidence': '/badges/audio.html',
            'expires': '2020/1/1',
            'icons': {'128': '/images/audio_128.png',},
            'ttl': 60 * 60 * 24,
        }
    
    def test_badge_validation(self):
        invalid_badge = self.valid_badge.copy()
        del invalid_badge['recipient']

        valid = Badge(self.valid_badge)
        invalid = Badge(invalid_badge)

        self.assertTrue(valid.is_valid(), "Valid badge should be valid")
        self.assertFalse(invalid.is_valid(), "Invalid badge should be invalid")

setup_test_database()

