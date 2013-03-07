const test = require('tap').test;
const express = require('express');
const http = require('http');
const url = require('url');
const facebook = require('../lib/facebook');

function withFakeGraphServer(cb) {
  return function(t) {
    var app = express();
    var server = http.createServer(app);
    server.listen(0, function() {
      var PORT = server.address().port;
      var HOSTNAME = 'localhost';
      var HOST = HOSTNAME + ':' + PORT;
      var PROTOCOL = 'http:';
      var BASE_URL = PROTOCOL + '//' + HOST;
      var resolve = function(path) { return url.resolve(BASE_URL, path); };

      facebook.BASE_URL = BASE_URL;

      cb(t, {
        PROTOCOL: PROTOCOL,
        PORT: PORT,
        HOST: HOST,
        HOSTNAME: HOSTNAME,
        BASE_URL: BASE_URL,
        app: app,
        server: server,
        resolve: resolve
      });

      t.test("shut down issuer server", function(t) {
        server.close();
        t.end();
      });
    });
  };
}

test("publishComment() works", withFakeGraphServer(function(t, graph) {
  var body, status;

  graph.app.post('/obj_id/comments', function(req, res) {
    return res.send(body, status);
  });

  t.test("returning error works", function(t) {
    body = "NO U";
    status = 500;
    facebook.publishComment("obj_id", "access_token", "hi", function(err) {
      t.equal(err, 'There was a problem commenting on Facebook.');
      t.end();
    });
  });

  t.test("returning non-JSON response works", function(t) {
    body = "I AM NOT JSON";
    status = 200;
    facebook.publishComment("obj_id", "access_token", "hi", function(err) {
      t.equal(err, 'There was a problem commenting on Facebook.');
      t.end();
    });
  });

  t.test("returning JSON response works", function(t) {
    body = {id: 15};
    status = 200;
    facebook.publishComment("obj_id", "access_token", "hi", function(err, id) {
      t.equal(err, null);
      t.equal(id, 15);
      t.end();
    });
  });  
}));
