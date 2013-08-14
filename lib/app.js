var url = require('url');
var express = require('express');

var securityHeaders = require('./security-headers');

exports.build = function(options) {
  var app = express();

  app.use(securityHeaders({
    enableHSTS: url.parse(options.origin).protocol == 'https:'
  }));

  app.get('/', function(req, res) {
    return res.send("HELLO WORLD");
  });

  return app;
};
