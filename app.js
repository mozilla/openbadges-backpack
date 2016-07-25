// Newrelic *must* be the first module loaded. Do not move this require module!
// docs, https://npmjs.org/package/newrelic
if ( process.env.NEW_RELIC_HOME ) {
  require( 'newrelic' );
}

// Configure & start express.
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

var csrf = require('csurf');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var passport = require('passport');

var app = express();

app.logger = logger;
app.config = configuration;

/* Default values for template variables */

app.locals.error = [];
app.locals.success = [];
app.locals.getBrowserIdScriptUrl = function() {
  return browserid.getIncludeScriptUrl();
};

app.set('useCompiledTemplates', configuration.get('nunjucks_precompiled'));

// default view engine
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader(__dirname + '/views'));
env.express(app);

env.addFilter('formatdate', function (rawDate) {
  if (parseInt(rawDate, 10) == rawDate) {
    var date = new Date(rawDate * 1000);
    return date.toString();
  }
  return rawDate;
});

require('./auth/passport')(passport); // pass passport for configuration

// Middleware. Also see `middleware.js`
// ------------------------------------
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
app.use(express.static(path.join(__dirname, "static")));
app.use("/views", express.static(path.join(__dirname, "views")));


// prepare session/cookie handling
app.use(bodyParser.json());
app.use(require('connect-multiparty')());
app.use(cookieParser());

var csrfProtection = csrf({ cookie: false });
var parseForm = bodyParser.urlencoded({ extended: false });

// configure views
nunjucks.configure('views', {
  autoescape: true,
  express: app
});




// app.use(middleware.staticTemplateViews(env, 'static/'));
// app.use(middleware.noFrame({ whitelist: [ '/issuer/frame.*', '/', '/share/.*' ] }));
// app.use(express.bodyParser());
// app.use(express.cookieParser());
// app.use(express.methodOverride());
// app.use(middleware.logRequests());
app.use(middleware.cookieSessions());
app.use(middleware.findPassportUser());
// app.use(middleware.userFromSession());
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());
// app.use(middleware.csrf({
//   whitelist: [
//     '/backpack/authenticate',
//     '/displayer/convert/.+',
//     '/issuer/frameless.*',
//     '/api/.+'
//   ]
// }));
// app.use(middleware.cors({ whitelist: ['/_badges.*', '/issuer.*', '/baker', '/displayer/.+/group.*'] }));
// app.use(middleware.statsdRequests());
// app.use(app.router);
// app.use(middleware.notFound());
// app.configure('development', function () {
//   var gitUtil = require('./lib/git-util');
//   try {
//     var sha = gitUtil.findSHA();
//     app.set('sha', sha);
//   }
//   catch (ex) {
//     logger.warn(ex);
//   }
//   browserid.configure({testUser: process.env['BROWSERID_TEST_USER']});
// });
// app.use(express.errorHandler());


// Routes
require('./routes.js')(app, passport, parseForm, csrfProtection); // load our routes and pass in our app and fully configured passport

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
  app.listen();
}
