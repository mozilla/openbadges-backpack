var url = require('url');
var express = require('express');
var clientSessions = require('client-sessions');

var securityHeaders = require('./security-headers');

exports.build = function(options) {
  var app = express();

  app.use(securityHeaders({
    enableHSTS: url.parse(options.origin).protocol == 'https:'
  }));

  app.use(express.bodyParser());
  app.use(clientSessions({
    cookieName: 'session',
    secret: options.cookieSecret,
    duration: options.cookieDuration ||
              24 * 60 * 60 * 1000, // defaults to 1 day
  }));
  app.use(express.csrf());

  app.get('/', function(req, res) {
    return res.send("HELLO WORLD");
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
