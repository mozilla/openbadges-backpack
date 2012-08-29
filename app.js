// Configure & start express.
var express = require('express');
var fs = require('fs');
var path = require('path');
var middleware = require('./middleware');
var logger = require('./lib/logging').logger;
var configuration = require('./lib/configuration');
var router = require('./lib/router');
var hogan = require('hogan.js');
var hoganadapter = require('./lib/hogan-express.js');

var app = express.createServer();
app.logger = logger;
app.config = configuration;

// default view engine
app.set('view engine', 'hogan.js');
app.register('hogan.js', hoganadapter.init(hogan));

// View helpers. `user` and `badges` are set so we can use them in `if`
// statements without getting undefined errors and without having to use typeof
// checks.
app.helpers({
  login: true,
  title: 'Backpack',
  error: [],
  success: [],
  badges: {},
  reverse: router.reverse
});

app.dynamicHelpers({
  user: function (req, res) {
    return req.user || null;
  }
});

// Middleware. See `middleware.js`
app.use(express.static(path.join(__dirname, "static")));
app.use(express.static(path.join(configuration.get('var_dir'), "badges")));
app.use(middleware.noFrame({ whitelist: [ '/issuer/frame.*', '/', '/share/.*' ] }));
app.use(express.bodyParser({ uploadDir: configuration.get('badge_path') }));
app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(middleware.logRequests());
app.use(middleware.cookieSessions());
app.use(middleware.userFromSession());
app.use(middleware.csrf({ 
  whitelist: [
    '/backpack/authenticate', 
    '/issuer/validator/?', 
    '/displayer/convert/.+', 
    '/issuer/frameless.*'
  ] 
}));
app.use(middleware.cors({ whitelist: ['/_badges.*', '/issuer.*', '/baker', '/displayer/.+/group.*'] }));

app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function () {
  app.use(express.errorHandler());
});

router(app)
  .get('/baker',                      'baker.baker')
  .delete('/badge/:badgeId',          'badge.destroy')
  .get('/issuer.js',                  'issuer.generateScript')
  .get('/issuer/frame',               'issuer.frame')
  .post('/issuer/frameless',          'issuer.frameless')
  .get('/issuer/assertion',           'issuer.issuerBadgeAddFromAssertion')
  .post('/issuer/assertion',          'issuer.issuerBadgeAddFromAssertion')

  .get('/issuer/validator',           'issuer.validator')
  .post('/issuer/validator',          'issuer.validator')
  .get('/issuer/welcome',             'issuer.welcome')


  .get('/displayer/:dUserId/groups.:format?',          'displayer.userGroups')
  .get('/displayer/:dUserId/group/:dGroupId.json',     'displayer.userGroupBadges')
  .get('/displayer/convert/email',                     'displayer.emailToUserIdView')
  .post('/displayer/convert/email',                    'displayer.emailToUserId')

  .get('/demo',                       'demo.issuer')
  .get('/demo/ballertime',            'demo.massAward')
  .get('/demo/badge.json',            'demo.demoBadge')
  .get('/demo/invalid.json',          'demo.badBadge')
  .post('/demo/award',                'demo.award')

  .get('/backpack/login',             'backpack.login')
  .get('/backpack/signout',           'backpack.signout')
  .get('/backpack/badge/:badgeId',    'backpack.details')
  .get('/',                           'backpack.manage')
  .get('/backpack',                   'backpack.manage')
  .post('/backpack/badge',            'backpack.userBadgeUpload')
  .post('/backpack/authenticate',     'backpack.authenticate')
  .delete('/backpack/badge/:badgeId', 'backpack.deleteBadge')

  .get('/stats',                      'backpack.stats')

  .post('/group',                     'group.create')
  .put('/group/:groupId',             'group.update')
  .delete('/group/:groupId',          'group.destroy')

  .get('/share/:groupUrl/edit',       'share.editor')
  .post('/share/:groupUrl',           'share.createOrUpdate')
  .put('/share/:groupUrl',            'share.createOrUpdate')
  .get('/share/:groupUrl',            'share.show');

if (!module.parent) {
  var start_server = function start_server(app) {
    var port = app.config.get('port');
    var pid = process.pid.toString();
    var pidfile = path.join(app.config.get('var_path'), 'server.pid');

    app.listen(port);
    app.logger.info('environment: ' + process.env['NODE_ENV']);
    app.logger.info('opening server on port: ' + port);
    app.logger.info('READY PLAYER ONE');

    fs.unlink(pidfile, function () {
      fs.writeFile(pidfile, pid, function (err) {
        if (err) throw Error('could not make pidfile: ' + err);
      });
    });

    process.on('SIGTERM', function () {
      app.logger.info('recieved SIGTERM, exiting');
      process.exit();
    });
  };
  start_server(app);
} else {
  module.exports = app;
}
