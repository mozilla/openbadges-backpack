// Configure & start express.
var express = require('express')
  , ejs = require('ejs')
  , fs = require('fs')
  , path = require('path')
  , middleware = require('./middleware')
  , controller = require('./controller')
  , logger = require('./lib/logging').logger
  , configuration = require('./lib/configuration')
;

// Create the app and set it up to use `ejs` templates which are easier to
// maintain than the default `jade` templates.
var app = express.createServer();
app.logger = logger;
app.config = configuration;

app.set('view engine', 'ejs');

// View helpers. `user` and `badges` are set so we can use them in `if`
// statements without getting undefined errors and without having to use typeof
// checks.
app.helpers({
  user: null,
  login: true,
  title: 'Backpack',
  error: [],
  badges: {}
});

// Middleware. See `middleware.js` for more information on the custom
// middleware used.
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.static(path.join(__dirname, "static")));
app.use(middleware.cookieSessions());
app.use(middleware.logRequests());
app.use(middleware.noFrame());

// Routing for the application. See `controller.js` for more information.
app.post('/authenticate',     controller.authenticate);
app.get('/signout',           controller.signout);
app.get('/login',             controller.login);
app.get('/baker',             controller.baker);
app.get('/test/badge.json',   controller.test_badge);
app.get('/test/invalid.json', controller.bad_badge);
app.get('/',                  controller.manage);

var start_server = function(app) {  
  var port = app.config.get('internal_port');
  var pid = process.pid.toString();
  var pidfile = path.join(app.config.get('var_path'), 'server.pid');

  app.listen(port);
  app.logger.info('opening server on port: ' + port);
  app.logger.info('READY PLAYER ONE')

  fs.unlink(pidfile, function(){
    fs.writeFile(pidfile, pid, function(err){
      if (err) throw Error('could not make pidfile: ' + err)
    });
  })
}

start_server(app);

exports.server = app;
exports.logger = logger;
exports.config = configuration;
