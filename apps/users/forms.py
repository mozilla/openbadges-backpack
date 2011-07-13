from django import forms
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.models import User
from models import UserProfile

class UserCreationForm(forms.ModelForm):
    """
    A form that creates a user, with no privileges, from the given username and password.
    """
    email = forms.EmailField(label=_("E-mail"), max_length=255, help_text = _("Required."),
        error_messages = {'invalid': _("This doesn't look like a valid email address")})
    password1 = forms.CharField(label=_("Password"), widget=forms.PasswordInput)
    password2 = forms.CharField(label=_("Password confirmation"), widget=forms.PasswordInput,
        help_text = _("Enter the same password as above, for verification."))

    class Meta:
        model = User
        fields = ("email",)

    def clean_email(self):
        email = self.cleaned_data["email"]
        try:
            User.objects.get(email=email)
        except User.DoesNotExist:
            return email
        raise forms.ValidationError(_("A user with that e-mail already exists."))

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1", "")
        password2 = self.cleaned_data["password2"]
        if password1 != password2:
            raise forms.ValidationError(_("The two password fields didn't match."))
        return password2

    def save(self, commit=True):
        user = super(UserCreationForm, self).save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        user.username = self.cleaned_data["email"]
        user.is_active = False
        if commit:
            user.save()
            profile = UserProfile(user=user)
            profile.generate_confirmation_code()
            profile.save()
        return user
