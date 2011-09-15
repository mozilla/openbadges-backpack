// Configure & start express.
var express = require('express')
  , csrf = require('express-csrf')
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

app.set('view engine', 'coffee');
app.register('.coffee', require('coffeekup').adapters.express)

// View helpers. `user` and `badges` are set so we can use them in `if`
// statements without getting undefined errors and without having to use typeof
// checks.
app.helpers({
  user: null,
  login: true,
  title: 'Backpack',
  error: [],
  success: [],
  badges: {},
  reverse: router.reverse,

  hardcode: {
    textbox: function(attrs) {
      attrs.type = 'text';
      attrs.name = attrs.id;
      return div(function(){input(attrs)});
    },
    safe: function(val) {
      return text(val.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    }
  }
});
app.dynamicHelpers({
  csrf: middleware.csrf.token
});

// Middleware. See `middleware.js` for more information on the custom
// middleware used.
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(middleware.logRequests());
app.use(middleware.formHandler());
app.use(middleware.cookieSessions());
app.use(middleware.noFrame([ '/share/.*' ]));
app.use(middleware.csrf.check([ '/backpack/badge', '/backpack/authenticate' ]));
app.use(middleware.getUser());

app.use(express.static(path.join(__dirname, "static")));
app.use(express.static(path.join(configuration.get('var_dir'), "badges")));

router(app)
  .get('/baker',                            'baker.baker')
  .get('/test',                             'test.issuer')
  .post('/test/award',                      'test.award')
  .get('/test/badge.json',                  'test.test_badge')
  .get('/test/invalid.json',                'test.bad_badge')
  .get('/backpack/login',                   'backpack.login')
  .post('/backpack/authenticate',           'backpack.authenticate')
  .get('/backpack/signout',                 'backpack.signout')
  .post('/backpack/badge',                  'backpack.upload')
  .get('/backpack/badge/:badgeId',          'backpack.details')
  .post('/backpack/badge/:badgeId/accept',  'backpack.apiAccept')
  .post('/backpack/badge/:badgeId/reject',  'backpack.apiReject')
  .post('/backpack/badge/:badgeId/groups',  'backpack.apiGroups')
  .get('/backpack',                         'backpack.manage')
  .get('/share/g/:groupId',                 'share.group')
  .get('/share/b/:badgeId',                 'share.badge')
  .get('/',                                 'backpack.manage')

if (!module.parent) {
  var start_server = function(app) {  
    var port = app.config.get('internal_port')
      , pid = process.pid.toString()
      , pidfile = path.join(app.config.get('var_path'), 'server.pid')

    app.listen(port);
    app.logger.info('environment: ' + process.env['NODE_ENV']);
    app.logger.info('opening server on port: ' + port);
    app.logger.info('READY PLAYER ONE')

    fs.unlink(pidfile, function(){
      fs.writeFile(pidfile, pid, function(err){
        if (err) throw Error('could not make pidfile: ' + err)
      });
    })
    process.on('SIGTERM', function(){
      app.logger.info('recieved SIGTERM, exiting');
      process.exit();
    })
  }
  start_server(app);
} else {
  module.exports = app;
}