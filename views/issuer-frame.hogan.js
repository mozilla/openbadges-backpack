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
      <a id="moztab" href="http://mozilla.org" target="_blank">a mozilla.org joint</a>
      <a class="close" href="#">&times;</a>
    </div>
  </div>
</div>

<div id="body" class="container-fluid">
  <div id="welcome">
    <p>Hi! You are about to submit a badge to the Mozilla Open Badge Backpack at <span class="host"></span>.</p>
    <div class="logged-in"><button class="next btn primary">Cool, let's go!</button> <button class="btn danger logout">I am not <span class="email"></span>.</button></div>
    <div class="logged-out">
      <p>To begin, you will need to log in.</p>
      <a class="js-browserid-link" href="#">
        <img src="https://browserid.org/i/sign_in_green.png"/>
      </a>
    </div>
  </div>
</div>
<script src="https://browserid.org/include.js"></script>
<script src="/js/jquery.min.js"></script>
<script src="/js/jschannel.js"></script>
<script src="/js/underscore.js"></script>
<script src="/js/backbone.js"></script>
<script src="/js/issuer-frame.js"></script>
