<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge;chrome=1" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title dir="ltr">Open Badge Backpack</title>
    
    <script type="text/javascript" src="/js/modernizr.js"></script>
    <script type="text/javascript" src="https://browserid.org/include.js"></script>
    <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
  </head>
  <body>
    <div id="body" class="container">
      <div id='message-container'>
        {{#error.length}}
          <div class="alert-message">
            <p><strong>{{error}}</strong></p>
          </div>
        {{/error.length}}
      </div>

      {{#success.length}}
        <div class="alert-message success">
          <p><strong>Yay! {{success[0]}}</strong></p>
        </div>
      {{/success.length}}

      {{{body}}}
    </div>
  </body>
</html>
