var express = require('express');

exports.build = function(options) {
  var app = express();

  app.get('/', function(req, res) {
    return res.send("HELLO WORLD");
  });

  return app;
};
