<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge;chrome=1" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    {{#opengraph}}
      <meta property="og:{{property}}" content="{{content}}" />
    {{/opengraph}}
    <link rel="icon" href="favicon.ico">
    <link rel="stylesheet" href="/css/socialshare.min.css" type="text/css" media="all" />
    <link rel="stylesheet" href="/css/bootstrap-2.0.2.min.css" />
    <link href="//www.mozilla.org/tabzilla/media/css/tabzilla.css" rel="stylesheet" />
    <link rel="stylesheet" href="/css/style.css" type="text/css" media="all" />
    <title dir="ltr">Open Badge Backpack</title>

    <script type="text/javascript" src="/js/modernizr.js"></script>
    <script type="text/javascript" src="https://login.persona.org/include.js"></script>
    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
  </head>
  <body>
    <div class="navbar">
      <div class="navbar-inner">
        <div class="container" style="position: relative;">
          <h3><a class="brand" href="/">Open Badge Backpack</a></h3>
          <a href="http://www.mozilla.org/" id="tabzilla">a mozilla.org joint</a>
          <ul class="nav">
            <li><a href="{{#reverse}}backpack.manage{{/reverse}}">Home</a></li>
            <li><a href="{{#reverse}}backpack.manage{{/reverse}}{{^tooltips}}?tooltips{{/tooltips}}">Help: {{#tooltips}}Off{{/tooltips}}{{^tooltips}}On{{/tooltips}}</a></li>
          </ul>
          {{#user}}
            <ul class="nav pull-right">
              <li class="user">{{attributes.email}}</li>
              <li><a href="{{#reverse}}backpack.signout{{/reverse}}">Sign Out</a></li>
            </ul>
          {{/user}}
        </div>
      </div>
    </div>

    <div id="body" class="container">
      <div class='message-container'>
      {{#error.length}}
        <div class="alert alert-error">
          <a class="close" data-dismiss="alert">×</a>
          {{error}}
        </div>
      {{/error.length}}

      {{#success.length}}
        <div class="alert alert-success">
          <a class="close" data-dismiss="alert">×</a>
          {{success}}
        </div>
      {{/success.length}}
      </div>

      {{{body}}}
    </div>

    <div id="footer" class="container">
      <aside>
        <h2>Legal</h2>
        <ul>
          <li><a href="/tou.html">Terms of Use</a></li>
          <li><a href="/privacy.html">Privacy Policy</a></li>
        </ul>
      </aside>
    </div>


      {{=|| ||=}} <!-- need to change delimeter so hogan doesn't parse these -->
      <script type="text/html" id="messageTpl">
        <div class="alert alert-{{type}}">
          <p><strong>{{message}}</strong></p>
        </div>
      </script>


      <!-- third party -->
      <script type="text/javascript" src="/js/ICanHaz.js"></script>
      <script type="text/javascript" src="/js/underscore.js"></script>
      <script type="text/javascript" src="/js/backbone.js"></script>
      <script type="text/javascript" src="/js/bootstrap-2.0.2.min.js"></script>
      <script src="//www.mozilla.org/tabzilla/media/js/tabzilla.js"></script>

      <!-- my libraries -->
      <script type="text/javascript" src="/js/jquery.sync.js"></script>
      <script type="text/javascript" src="/js/backpack.js"></script>

  </body>
</html>
