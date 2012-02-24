<!DOCTYPE html>
<meta charset="utf-8">
<meta http-equiv="X-CSRF-Token" content="{{ csrfToken }}">
<meta http-equiv="X-Current-User" content="{{ email }}">
<title>Issuer Frame</title>
<div class="logged-out" style="display: none">
  <a class="js-browserid-link" href="#"><img src="https://browserid.org/i/sign_in_green.png"/></a>
</div>
<div class="logged-in" style="display: none">
  <p>Hello.</p>
</div>
<script src="https://browserid.org/include.js"></script>
<script src="/js/jquery.min.js"></script>
<script src="/js/jschannel.js"></script>
<script src="/js/issuer-frame.js"></script>
