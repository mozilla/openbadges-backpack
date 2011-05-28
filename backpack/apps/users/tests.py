from django.test import TestCase
from django.test.client import RequestFactory, Client
from django.contrib.auth.models import User
from models import UserProfile
from forms import UserCreationForm
import views

class UserTests(TestCase):
    def setUp(self):
        self.u = {'email':'test@example.com', 'pass':'password'}
        self.factory = RequestFactory()
        self.client = Client()
    
    def tearDown(self):
        try:    User.objects.get(username=self.u['email']).delete()
        except: pass
    
    def create_user(self):
        UserCreationForm({
            'email': self.u['email'],
            'password1': self.u['pass'],
            'password2': self.u['pass'],
        }).save()
        return User.objects.get(username=self.u['email'])
        
        
    def test_create_valid_user(self):
        request = self.factory.post('/register', {
            'email': self.u['email'],
            'password1': self.u['pass'],
            'password2': self.u['pass'],
        })
        response = views.register(request)
        try:
            user = User.objects.get(username=self.u['email'])
        except User.DoesNotExist:
            user = None
        self.assertIsInstance(user, User, "User creation failed")
        self.assertEqual(response.status_code, 302, "Failed to redirect on successful creation")
    
    def test_non_matching_password(self):
        request = self.factory.post('/register', {
            'email': self.u['email'],
            'password1': self.u['pass'],
            'password2': 'tubular',
        })
        response = views.register(request)
        try:
            user = User.objects.get(username=self.u['email'])
        except User.DoesNotExist:
            user = None
        self.assertNotIsInstance(user, User, "User creation should have failed with non-matching password.")
        self.assertEqual(response.status_code, 200, "Should stay on same page when password validation fails")

    def test_new_users_need_to_activate(self):
        UserCreationForm({
            'email': self.u['email'],
            'password1': self.u['pass'],
            'password2': self.u['pass'],
        }).save()
        logged_in = self.client.login(username=self.u['email'], password=self.u['pass'])
        self.assertFalse(logged_in, "Should not be able to login without activating")
        
    def test_getting_users_profile(self):
        user = self.create_user()
        profile = user.get_profile()
        self.assertIsInstance(profile, UserProfile, "Could not get user profile")
        code = profile.get_confirmation_code()
        self.assertEqual(len(code), 60, "Didn't generate a proper confirmation code")
