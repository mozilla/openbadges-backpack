// Configure & start express.
var express = require('express')
  , csrf = require('express-csrf')
  , ejs = require('ejs')
  , fs = require('fs')
  , path = require('path')
  , middleware = require('./middleware')
  , logger = require('./lib/logging').logger
  , configuration = require('./lib/configuration')
  , router = require('./lib/router')

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
  badges: {},
  reverse: router.reverse
});
app.dynamicHelpers({
  csrf: middleware.csrf.token
});

// Middleware. See `middleware.js` for more information on the custom
// middleware used.
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(middleware.logRequests());
app.use(middleware.noFrame());
app.use(middleware.formHandler());
app.use(middleware.cookieSessions());
app.use(middleware.csrf.check());
app.use(express.static(path.join(__dirname, "static")));
app.use(express.static(path.join(configuration.get('var_dir'), "badges")));

router(app)
  .get('/baker',                      'baker.baker')
  .get('/test',                       'test.issuer')
  .post('/test/award',                'test.award')
  .get('/test/badge.json',            'test.test_badge')
  .get('/test/invalid.json',          'test.bad_badge')
  .get('/backpack/login',             'backpack.login')
  .post('/backpack/authenticate',     'backpack.authenticate')
  .get('/backpack/signout',           'backpack.signout')
  .post('/backpack/badge/upload',     'backpack.upload')
  .post('/backpack/badge/:id/accept',  'backpack.apiAccept')
  .post('/backpack/badge/:id/reject',  'backpack.apiReject')
  .get('/backpack',                   'backpack.manage')
  .get('/',                           'backpack.manage')

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
