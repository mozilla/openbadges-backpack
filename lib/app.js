var _ = require('underscore');
var url = require('url');
var express = require('express');
var nunjucks = require('nunjucks');
var clientSessions = require('client-sessions');

var paths = require('./paths');
var persona = require('./persona');
var securityHeaders = require('./security-headers');

exports.build = function(options) {
  var app = express();
  var loaders = [
    new nunjucks.FileSystemLoader(paths.templateDir)
  ].concat(options.extraTemplateLoaders || []);
  var nunjucksEnv = new nunjucks.Environment(loaders, {
    autoescape: true
  });

  _.extend(app.locals, {
    DOT_MIN: options.debug ? '' : '.min'
  });

  app.use(securityHeaders({
    enableHSTS: url.parse(options.origin).protocol == 'https:'
  }));
  app.use(express.static(paths.staticDir));
  if (options.debug)
    app.use('/test', express.static(paths.staticTestDir));

  nunjucksEnv.express(app);

  app.use(express.bodyParser());
  app.use(clientSessions({
    cookieName: 'session',
    secret: options.cookieSecret,
    duration: options.cookieDuration ||
              24 * 60 * 60 * 1000, // defaults to 1 day
  }));
  app.use(express.csrf());
  app.use(function setUniversalTemplateVars(req, res, next) {
    res.locals.csrfToken = req.session._csrf;
    res.locals.email = req.session.email;
    next();
  });

  persona.express(app, {
    audience: options.origin,
    jsUrl: options.personaJsUrl,
    defineRoutes: options.personaDefineRoutes
  });

  app.get('/', function(req, res) {
    return res.render('layout.html');
  });

  if (options.defineExtraRoutes) options.defineExtraRoutes(app);

  app.use(function(err, req, res, next) {
    if (typeof(err.status) == 'number')
      return res.type('text/plain').send(err.status, err.message);
    process.stderr.write(err.stack);
    res.send(500, 'Sorry, something exploded!');
  });

  return app;
};
