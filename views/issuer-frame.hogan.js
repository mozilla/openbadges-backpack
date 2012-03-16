<!DOCTYPE html>
<meta charset="utf-8">
<meta http-equiv="X-CSRF-Token" content="{{ csrfToken }}">
<meta http-equiv="X-Current-User" content="{{ email }}">
<link rel="stylesheet" href="/css/bootstrap-1.2.0.min.css" />
<link rel="stylesheet" href="/css/style.css" type="text/css" media="all" />
<link rel="stylesheet" href="/css/issuer-frame.css" type="text/css" media="all" />
<title>Issuer Frame</title>
<div class="topbar">
  <div class="topbar-inner">
    <div class="container-fluid" style="position: relative;">
      <h3><a href="/" target="_blank">Open Badge Backpack</a></h3>
      <img src="/images/ajax-loader.gif" id="ajax-loader">
      <a id="moztab" href="http://mozilla.org" target="_blank">a mozilla.org joint</a>
      <a class="close" href="#">&times;</a>
    </div>
  </div>
</div>

<div id="body" class="container-fluid">
  <div id="messages"></div>
  <div id="welcome" style="display: none">
    <p>Hi! You are about to submit a badge to the Mozilla Open Badge Backpack at <span class="host"></span>.</p>
    <div class="logged-in"><button class="next btn primary">Cool, let's go!</button> <button class="btn danger logout">I am not <span class="email"></span>.</button></div>
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
    <button class="next btn primary">Thanks.</button>
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
    <div class="alert-message danger">
      <strong>Sorry!</strong> An error occurred when trying to add the
      <em>[[ assertion.badge.name ]]</em> badge to your backpack.
    </div>
  </div>
  <div id="already-exists-template">
    <div class="alert-message">
      You appear to already have the
      <em>[[ assertion.badge.name ]]</em> badge in your backpack.
    </div>
  </div>
  <div id="login-error-template">
    <div class="alert-message danger">
      <strong>Sorry!</strong> An error occurred when trying to log you in.
    </div>
  </div>
  <div id="badge-ask-template" style="display: none">
    <div class="row">
      <div class="span-one-third columns management">
        <div class="accept-reject">
          <h2>Accept this badge?</h2>
          <button class="accept btn primary">Yup</button>
          <button class="reject btn danger">Nope</button>
        </div>
      </div>
      <div class="span-one-third columns badge-details">
        <dl>
          <dt>Recipient</dt>
          <dd>[[ assertion.recipient ]]</dd>

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
      <div class="span-one-third columns">
        <img class="badge-image" src="[[assertion.badge.image]]" alt="Badge Image"/>
      </div>
    </div>
  </div>
</div>
<script src="https://browserid.org/include.js"></script>
<script src="/js/jquery.min.js"></script>
<script src="/js/jschannel.js"></script>
<script src="/js/underscore.js"></script>
<script src="/js/backbone.js"></script>
<script src="/js/issuer-frame.js"></script>
