from django.test import TestCase
from django.test.client import RequestFactory
from django.contrib.auth.models import User
from forms import UserCreationForm
import views

class CreateUser(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
    
    def test_create_valid_user(self):
        test_email = 'test@example.com'
        request = self.factory.post('/register', {'email': test_email,
                                                  'password1':'rad', 'password2':'rad'})
        response = views.register(request)
        try:
            user = User.objects.get(email=test_email)
        except User.DoesNotExist:
            user = None
        self.assertIsInstance(user, User, "User creation failed")
        self.assertEqual(response.status_code, 302, "Failed to redirect on successful creation")
    
    def test_non_matching_password(self):
        test_email = 'test2@example.com'
        request = self.factory.post('/register', {'email': test_email,
                                                  'password1':'rad', 'password2':'tubular'})
        response = views.register(request)
        try:
            user = User.objects.get(email=test_email)
        except User.DoesNotExist:
            user = None
        self.assertNotIsInstance(user, User, "User creation should have failed with non-matching password.")
        self.assertEqual(response.status_code, 200, "Should stay on same page when password validation fails")
