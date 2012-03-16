<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge;chrome=1" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="/css/bootstrap-1.2.0.min.css" />
    <link rel="stylesheet" href="/css/tooltip-bootstrap.min.css" />
    <link rel="stylesheet" href="/css/style.css" type="text/css" media="all" />
    <title dir="ltr">Open Badge Backpack</title>

    <script type="text/javascript" src="/js/modernizr.js"></script>
    <script type="text/javascript" src="https://browserid.org/include.js"></script>
    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
  </head>
  <body>
    <div class="topbar">
      <div class="topbar-inner">
        <div class="container" style="position: relative;">
          <h3><a href="/">Open Badge Backpack</a></h3>
          <a id="moztab" href="http://mozilla.org">a mozilla.org joint</a>
          <ul class="nav">
            <li><a href="{{#reverse}}backpack.manage{{/reverse}}">Home</a></li>
            <li><a href="{{#reverse}}backpack.signout{{/reverse}}">Sign Out</a></li>
            <li><a href="{{#reverse}}backpack.manage{{/reverse}}{{^tooltips}}?tooltips{{/tooltips}}">Help: {{#tooltips}}Off{{/tooltips}}{{^tooltips}}On{{/tooltips}}</a></li>
          </ul>
        </div>
      </div>
    </div>

    <div id="body" class="container">
      <div class='message-container'>
      {{#error.length}}
        <div class="alert-message">
          <p><strong>{{error}}</strong></p>
        </div>
      {{/error.length}}
      
      {{#success.length}}
        <div class="alert-message success">
          <p><strong>{{success}}</strong></p>
        </div>
      {{/success.length}}
      </div>

      {{{body}}}
    </div>
      
      
      {{=|| ||=}} <!-- need to change delimeter so hogan doesn't parse these -->
      <script type="text/html" id="messageTpl">
        <div class="alert-message {{type}}">
          <p><strong>{{message}}</strong></p>
        </div>
      </script>
    
      
      <!-- third party -->
      <script type="text/javascript" src="/js/ICanHaz.js"></script>
      <script type="text/javascript" src="/js/underscore.js"></script>
      <script type="text/javascript" src="/js/backbone.js"></script>
      <script type="text/javascript" src="/js/tooltip-bootstrap.min.js"></script>
      
      <!-- my libraries -->
      <script type="text/javascript" src="/js/jquery.sync.js"></script>
      <script type="text/javascript" src="/js/backpack.js"></script>
      
  </body>
</html>
