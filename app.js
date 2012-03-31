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

// View helpers. `user` and `badges` are set so we can use them in `if`
// statements without getting undefined errors and without having to use typeof
// checks.
app.helpers({
  login: true,
  title: 'Backpack',
  error: [],
  success: [],
  badges: {},
  reverse: router.reverse,
});

app.dynamicHelpers({
  user: function(req, res){
    return req.user || null;
  }
});

// Middleware. See `middleware.js`
app.use(express.static(path.join(__dirname, "static")));
app.use(express.static(path.join(configuration.get('var_dir'), "badges")));
app.use(middleware.noFrame({ whitelist: [ '/issuer/frame', '/', '/share/.*' ] }));
app.use(express.bodyParser({ uploadDir:configuration.get('badge_path') }));
app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(middleware.logRequests());
app.use(middleware.cookieSessions());
app.use(middleware.userFromSession());
app.use(middleware.csrf({ whitelist: ['/issuer/validator/?'] }));
app.use(middleware.cors({ whitelist: ['/_badges.*', '/issuer.*', '/baker'] }));

router(app)
  .get('/baker',                      'baker.baker')
  .delete('/badge/:badgeId',          'badge.destroy')
  .get('/issuer\.js',                 'issuer.generateScript')
  .get('/issuer/frame',               'issuer.frame')
  .get('/issuer/assertion',           'issuer.issuerBadgeAddFromAssertion')
  .post('/issuer/assertion',          'issuer.issuerBadgeAddFromAssertion')
  
  .get('/issuer/validator',           'issuer.validator')
  .post('/issuer/validator',          'issuer.validator')

  
  .get('/displayer/:dUserId/groups.json',          'displayer.userGroups')
  .get('/displayer/:dUserId/group/:dGroupId.json', 'displayer.userGroupBadges')

  .get('/demo',                       'demo.issuer')
  .get('/demo/ballertime',            'demo.massAward')
  .get('/demo/badge.json',            'demo.testBadge')
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
  
  .post('/group',                     'group.create')
  .put('/group/:groupId',             'group.update')
  .delete('/group/:groupId',          'group.destroy')
  
  .get('/share/:groupUrl/edit',       'share.editor')
  .post('/share/:groupUrl',           'share.createOrUpdate')
  .put('/share/:groupUrl',            'share.createOrUpdate')
  .get('/share/:groupUrl',            'share.show')

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
