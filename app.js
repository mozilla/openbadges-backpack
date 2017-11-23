// Newrelic *must* be the first module loaded. Do not move this require module!
// docs, https://npmjs.org/package/newrelic
if ( process.env.NEW_RELIC_HOME ) {
  require( 'newrelic' );
}

// load required modules
var express = require('express');
var http = require('http');
var fs = require('fs');
var path = require('path');
var middleware = require('./middleware');
var logger = require('./lib/logger');
var browserid = require('./lib/browserid');
var configuration = require('./lib/configuration');
var flash = require('connect-flash');
var nunjucks = require('nunjucks');
var _ = require('underscore');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');

var csrf = require('csurf');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var passport = require('passport');

// let's get this show on the road... fire up express!
var app = express();

app.logger = logger;
app.config = configuration;

// default values for template variables
app.locals.error = [];
app.locals.success = [];

// should we be using pre-compiled templates?
app.set('useCompiledTemplates', configuration.get('nunjucks_precompiled'));

// configure nunjucks environment
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader(__dirname + '/views'));
// configure views
nunjucks.configure('views', {
  autoescape: true,
  express: app
});
env.express(app);

// formatdate filter
env.addFilter('formatdate', function (rawDate) {
  if (parseInt(rawDate, 10) == rawDate) {
    var date = new Date(rawDate * 1000);
    return date.toString();
  }
  return rawDate;
});

// pass passport for configuration
require('./auth/passport')(passport, configuration);

// middleware. also see `middleware.js`
if (configuration.get('force_https')) {
  var force_ssl = require('express-enforces-ssl');
  var hsts = require('hsts');

  // trust X-Forwarded-Proto header
  app.enable('trust proxy');
  app.use(force_ssl());
  app.use(hsts({ maxAge: 10886400000 }))
}

// compile stylesheets at runtime
app.use(middleware.less());

// set static and views paths
app.use(express.static(path.join(__dirname, "static")));
app.use("/views", express.static(path.join(__dirname, "views")));

// prepare session/cookie handling
app.use(bodyParser.json());
app.use(require('connect-multiparty')());
app.use(cookieParser());

// init csurf protection (gets passed to router later on)
var csrfProtection = csrf({ cookie: false });
var parseForm = bodyParser.urlencoded({ extended: false });

// setup middleware
app.use(middleware.staticTemplateViews(env, 'static/'));
app.use(middleware.noFrame({ whitelist: [ '/issuer/frame.*', '/', '/share/.*', '/backpack/login', '/backpack/login/issuer' ] }));
app.use(methodOverride());
app.use(middleware.logRequests());
app.use(middleware.cookieSessions());
app.use(middleware.findPassportUser());
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());
app.use(middleware.cors({ whitelist: ['/_badges.*', '/issuer.*', '/baker', '/displayer/.+/group.*'] }));
app.use(middleware.statsdRequests());
app.use(errorHandler());

// development-specific app properties
if (process.env['NODE_ENV'] === 'development') {
  var gitUtil = require('./lib/git-util');
  try {
    var sha = gitUtil.findSHA();
    app.set('sha', sha);
  }
  catch (ex) {
    logger.warn(ex);
  }
};

var year = new Date().getFullYear();
app.set('year', year);

// load our routes and pass in our app and fully configured passport
require('./routes.js')(app, passport, parseForm, csrfProtection);

// let's fire up the server
if (!module.parent) {
  var startServer = function startServer(app) {
    var port = app.config.get('port');
    var pid = process.pid.toString();
    var pidfile = path.join(app.config.get('var_path'), 'server.pid');

    app.listen(port);
    app.logger.info('environment: %s', process.env['NODE_ENV']);
    app.logger.info('opening server on port: %s', port);
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
  startServer(app);
} else {
  // server to use when running unit tests
  module.exports = http.createServer(app);
}
