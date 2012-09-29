{% extends "layout.hogan.js" %}
{% block body %}
<h1>Welcome</h1>
<h2>Use the green button below to <a href="#" class="js-browserid-link">sign in.</a><br/> Don&rsquo;t worry if you don&rsquo;t have an account, that&rsquo;ll get taken care of.</h2>

<form class="signin js-browserid-form" method="POST" action="{{ reverse('backpack.authenticate') }}">
  <input class="js-browserid-input" name="assertion" type="hidden"></input>
  <input name="_csrf" type="hidden" value="{{ csrfToken }}"></input>
</form>

<div style="padding-top: 10px">
  <a class="js-browserid-link" href="#"><img src="https://browserid.org/i/sign_in_green.png"/></a>
</div>

<script type="text/javascript">
!!function loginHandler () {
//begin login handler
  
  function launchBrowserId(callback) {
    return function() { navigator.id.get(callback, {
      siteName: 'Open Badge Backpack',
      termsOfService: '/tou.html',
      privacyPolicy: '/privacy.html',
      returnTo: '/'
    }); }
  }
  function handleResponse(assertion) {
    if (!assertion) return false;
    $('.js-browserid-input').val(assertion);
    $('.js-browserid-form').trigger('submit');
  }
  $('.js-browserid-link').bind('click', launchBrowserId(handleResponse));

//begin login handler scope
}();
</script>
{% endblock %}