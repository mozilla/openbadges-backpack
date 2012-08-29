<!DOCTYPE html>
<meta charset="utf-8">
<meta http-equiv="X-CSRF-Token" content="{{ csrfToken }}">
<meta http-equiv="X-Current-User" content="{{ email }}">
{{#framed}}
<script>
  /* Requesting the framed badge acceptance screen from outside
   * an iframe probably means we're coming from Persona's redirect
   * on account creation. Let's kick over to the welcome screen instead.
   */
   if (window.top === window.self) {
    window.location = "{{#reverse}}issuer.welcome{{/reverse}}";
  }
</script>
{{/framed}}
<link rel="stylesheet" href="/css/bootstrap-2.0.2.min.css" />
<link rel="stylesheet" href="/css/style.css" type="text/css" media="all" />
<link rel="stylesheet" href="/css/badge-accept.css" type="text/css" media="all" />
<title>Accept Your Badges</title>
<div class="navbar navbar-fixed-top">
  <div class="navbar-inner">
    <div class="container-fluid" style="position: relative;">
      <h3><a class="brand" href="/" target="_blank">Open Badge Backpack</a></h3>
      <img src="/images/ajax-loader.gif" id="ajax-loader">
      <a id="moztab" href="http://mozilla.org" target="_blank">a mozilla.org joint</a>
      {{#framed}}<a class="close closeFrame" href="#">&times;</a>{{/framed}}
    </div>
  </div>
</div>

<div id="body" class="container-fluid">
  <div id="messages"></div>
  <div id="welcome" style="display: none">
    <p>Hi! You are about to submit <span class="badge-count">a badge</span> to the Mozilla Open Badge Backpack at <span class="host"></span><span class="logged-in"> as <span class="email"></span></span>.</p>
    <div class="logged-in"><button class="next btn btn-primary">Cool, let's go!</button> <button class="btn btn-danger logout">I am not <span class="email"></span>.</button></div>
    <div class="logged-out">
      <p>To begin, you will need to log in.</p>
      <a class="js-browserid-link" href="#">
        <img src="https://browserid.org/i/sign_in_green.png"/>
      </a>
    </div>
  </div>
  <div id="farewell" style="display: none">
    <h3 class="badges-0" style="display: none">You didn't add any badges to your backpack.</h3>
    <h3 class="badges-1" style="display: none">You added one badge to your backpack.</h3>
    <h3 class="badges-many" style="display: none">You added <span class="badges-added"></span> badges to your backpack.</h3>
    <p>If you ever want to manage or view your badges, just visit your
    <a href="/" target="_blank">Open Badge Backpack</a>.</p>
    <button class="next btn btn-primary">Thanks.</button>
  </div>
  <div id="badge-ask" style="display: none">
  </div>
  <div id="test-info" style="display: none">
    <hr>
    <p style="font-size: smaller"><strong>This page is operating in test mode.</strong> All data and network operations
    are simulated. For information on the API used to communicate with this
    page, see the
    <a href="https://github.com/mozilla/openbadges/wiki/Issuer-API">Issuer
    API Documentation</a>.</p>
    <div class="log"></div>
  </div>
</div>
<div id="templates" style="display: none">
  <div id="accept-failure-template">
    <div class="alert alert-error">
      <a class="close">×</a>
      <strong>Sorry!</strong> An error occurred when trying to add the
      <em>[[ assertion.badge.name ]]</em> badge to your backpack.
    </div>
  </div>
  <div id="already-exists-template">
    <div class="alert">
      <a class="close">×</a>
      You appear to already have the
      <em>[[ assertion.badge.name ]]</em> badge in your backpack.
    </div>
  </div>
  <div id="owner-mismatch-template">
    <div class="alert alert-error">
      <a class="close">×</a>
      It appears that the
      <em>[[ assertion.badge.name ]]</em> badge was not awarded to you ([[ user ]]).
    </div>
  </div>
  <div id="inaccessible-template">
    <div class="alert alert-error">
      <a class="close">×</a>
      We have encountered the following problem: <em>[[ error.message ]]</em>
    </div>
  </div>
  <div id="login-error-template">
    <div class="alert alert-error">
      <strong>Sorry!</strong> An error occurred when trying to log you in.
    </div>
  </div>
  <div id="badge-ask-template" style="display: none">
    <div class="row">
      <div class="span4 columns management">
        <div class="accept-reject">
          <h2>Accept this badge?</h2>
          <button class="accept btn btn-primary">Yup</button>
          <button class="reject btn btn-danger">Nope</button>
        </div>
        <img class="badge-image" src="[[assertion.badge.image]]" alt="Badge Image"/>
      </div>
      <div class="span4 columns badge-details">
        <dl>
          <dt>Recipient</dt>
	        <dd>[[ unhashedRecipient ]]</dd>

          <dt>Name</dt>
          <dd>[[ assertion.badge.name ]]</dd>

          <dt>Description</dt>
          <dd>[[ assertion.badge.description ]]</dd>

          <dt>Criteria</dt>
          <dd><a href="[[assertion.badge.criteria]]">[[ assertion.badge.criteria ]]</a></dd>

          <dt>Issuer</dt>
          <dd>[[ assertion.badge.issuer.name ]] (<a href="[[assertion.badge.issuer.origin]]">[[ assertion.badge.issuer.origin ]]</a>)</dd>
        </dl>
      </div>
    </div>
  </div>
</div>
<script src="https://login.persona.org/include.js"></script>
<script src="/js/jquery.min.js"></script>
<script src="/js/jschannel.js"></script>
<script src="/js/underscore.js"></script>
<script src="/js/backbone.js"></script>
<script src="/js/badge-accept/badge-accept.js"></script>
<script src="/js/badge-accept/main.js"></script>
{{#framed}}
  <script src="/js/badge-accept/build-channel.js"></script>
  <script>
    $(window).ready(function(){
      var channel = buildChannel();
    });
  </script>
{{/framed}}
{{^framed}}
  <script>
    $(window).ready(function(){
      window.issue({{{assertions}}}, function(){
        window.location = "{{#reverse}}backpack.manage{{/reverse}}";
      });
    });
  </script>
{{/framed}}
