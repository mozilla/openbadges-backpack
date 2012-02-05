<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge;chrome=1" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="/css/bootstrap-1.2.0.min.css" />
    <link rel="stylesheet" href="/css/style.css" type="text/css" media="all" />
    <title dir="ltr">Open Badge Backpack</title>
    <script type="text/javascript" src="/js/modernizr.js"></script>
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
          </ul>
        </div>
      </div>
    </div>

    <div id="body" class="container">
      {{#error.length}}
        <div class="alert-message error js-alert-container">
          <a href="#"><p><strong>Oh no! {{error}}</strong></p></a>
        </div>
      {{/error.length}}

      {{#success.length}}
        <div class="alert-message success js-alert-container">
          <a href="#"><p><strong>Yay! {{success[0]}}</strong></p></a>
        </div>
      {{/success.length}}
             
      {{{body}}}

      <!-- third party -->
      <script type="text/javascript" src="https://browserid.org/include.js"></script>
      <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
      <script type="text/javascript" src="/js/ICanHaz.js"></script>
      <script type="text/javascript" src="/js/underscore.js"></script>
      <script type="text/javascript" src="/js/backbone.js"></script>
      
      <!-- my libraries -->
      <script type="text/javascript" src="/js/jquery.sync.js"></script>
      <script type="text/javascript" src="/js/backbonepack.js"></script>
      <script type="text/javascript">
  
  window.modal = {
    main: $('.modal'),
    blanker: $('.blanker'),
    close: $('.modal a.close'),
    button: $('.modal a.btn'),
    title: $('.modal-header h3'),
    body: $('.modal-body'),
    hide: function() {
      modal.main.fadeOut();
      return modal.blanker.fadeOut();
    },
    show: function(title, body) {
      modal.title.html(title);
      modal.body.html(body);
      modal.main.fadeIn();
      modal.blanker.fadeIn();
      return modal;
    },
    setup: function() {
      modal.close.bind('click', modal.hide);
      modal.blanker.bind('click', modal.hide);
      modal.button.bind('click', modal.hide);
      $('body').bind('keyup', function(e) {
        console.log(e);
        if (e.keyCode === 27) return modal.hide();
      });
      return modal;
    }
    }
        </script>

        <div class="modal" style="position: relative, top: auto, left: auto, margin: 0 auto; z-index: 10">
          <div class="modal-header">
            <h3></h3>
            <a class="close" href="#">×</a>
          </div>
          <div class="modal-body">
            <p></p>
          </div>
          <div class="modal-footer">
            <a class="btn primary" href="#">Okay</a>
          </div>
        </div>
    </div>
  </body>
</html>
