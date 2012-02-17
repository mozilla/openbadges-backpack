// Configure & start express.
var express = require('express')
  , fs = require('fs')
  , path = require('path')
  , middleware = require('./middleware')
  , logger = require('./lib/logging').logger
  , configuration = require('./lib/configuration')
  , router = require('./lib/router')
  , hogan = require('hogan.js')
  , hoganadapter = require('./lib/hogan-express.js')

var app = express.createServer();
app.logger = logger;
app.config = configuration;

// default view engine
app.set('view engine', 'hogan.js');
app.register('hogan.js', hoganadapter.init(hogan))
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
// Middleware. See `middleware.js` for more information on the custom
// middleware used.
app.use(express.static(path.join(__dirname, "static")));
app.use(express.static(path.join(configuration.get('var_dir'), "badges")));
app.use(middleware.noFrame({ whitelist: [ '/', '/chris', '/share/.*' ] }));
app.use(express.bodyParser({ uploadDir:configuration.get('badge_path') }));
app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(middleware.logRequests());
app.use(middleware.cookieSessions());
app.use(middleware.userFromSession());
app.use(middleware.csrf());

// Allow everything to be used with CORS.
// This should probably just be limited to badges
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

router(app)
  .get('/chris',                   'chris.chris')
  .get('/baker',                   'baker.baker')
                                   
  .get('/demo',                    'demo.issuer')
  .get('/demo/ballertime',         'demo.massAward')
  .get('/demo/badge.json',         'demo.testBadge')
  .get('/demo/invalid.json',       'demo.badBadge')
  .post('/demo/award',             'demo.award')
                                   
  .get('/backpack/login',          'backpack.login')
  .get('/backpack/signout',        'backpack.signout')
  .get('/',                        'backpack.manage')
  .get('/backpack',                'backpack.manage')
  .post('/backpack/badge',         'backpack.userBadgeUpload')
  .post('/backpack/authenticate',  'backpack.authenticate')
                                   
  .post('/group',                  'group.create')
  .delete('/group/:groupId',       'group.destroy')
  .get('/group/:groupId',          'group.config')
  .put('/group/:groupId',          'group.update')

  .delete('/badge/:badgeId',       'badge.destroy')


if (!module.parent) {
  var start_server = function(app) {  
    var port = app.config.get('port')
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