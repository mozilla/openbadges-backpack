// Configure & start express.
var express = require('express')
  , ejs = require('ejs')
  , fs = require('fs')
  , path = require('path')
  , middleware = require('./middleware')
  , logger = require('./lib/logging').logger
  , configuration = require('./lib/configuration')

// helper method for doing controller routing.
var _ = function(cPath) {
  var ref = cPath.split('.');
  return require('./controllers/' + ref[0])[ref[1]];
}

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
app.use(middleware.logRequests());
app.use(middleware.noFrame());
app.use(middleware.formHandler());
app.use(middleware.cookieSessions());
app.use(express.static(path.join(__dirname, "static")));
app.use(express.static(path.join(configuration.get('var_dir'), "badges")));

// Routing for the application.
app.get('/baker',             _('baker.baker'));

app.get('/test',              _('test.issuer'));
app.post('/test/award',       _('test.award'));
app.get('/test/badge.json',   _('test.test_badge'));
app.get('/test/invalid.json', _('test.bad_badge'));

app.get('/login',             _('backpack.login'));
app.post('/authenticate',     _('backpack.authenticate'));
app.get('/signout',           _('backpack.signout'));
app.post('/badge-upload',     _('backpack.upload'));
app.get('/',                  _('backpack.manage'));

var start_server = function(app) {  
  var port = app.config.get('internal_port')
    , pid = process.pid.toString()
    , pidfile = path.join(app.config.get('var_path'), 'server.pid')
  
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
