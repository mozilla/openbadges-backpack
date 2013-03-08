const test = require('tap').test;
const express = require('express');
const http = require('http');
const url = require('url');
const querystring = require('querystring');
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
      var originalBaseUrl = facebook.BASE_URL;
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

      t.test("(shutting down fake graph server)", function(t) {
        facebook.BASE_URL = originalBaseUrl;
        server.close();
        t.end();
      });
    });
  };
}

test("publishBadge() works", withFakeGraphServer(function(t, graph) {
  var body, status;

  graph.app.post('/userid/open-badges:award', function(req, res) {
    t.equal(req.query.access_token, 'token');
    t.equal(url.parse(req.query.badge).pathname, '/share/badge/hash');
    return res.send(body, status);
  });

  t.test("when fb is nice", function(t) {
    body = {id: "newid"};
    status = 200;
    facebook.publishBadge('token', 'hash', 'userid', function(err, id) {
      t.equal(err, null);
      t.equal(id, "newid");
      t.end();
    });
  });

  t.test("when fb returns non-200 response", function(t) {
    body = "NO U";
    status = 500;
    facebook.publishBadge('token', 'hash', 'userid', function(err, id) {
      t.equal(err, "There was a problem sharing with Facebook.");
      t.end();
    });
  });

  t.test("when fb returns non-JSON 200 response", function(t) {
    body = "NO U";
    status = 200;
    facebook.publishBadge('token', 'hash', 'userid', function(err, id) {
      t.equal(err, "There was a problem sharing with Facebook.");
      t.end();
    });
  });
}));

test("publishComment() works", withFakeGraphServer(function(t, graph) {
  var body, status;

  graph.app.post('/obj_id/comments', function(req, res) {
    t.same(req.query, {access_token: "access_token", message: "hi"});
    return res.send(body, status);
  });

  t.test("when fb returns error", function(t) {
    body = "NO U";
    status = 500;
    facebook.publishComment("obj_id", "access_token", "hi", function(err) {
      t.equal(err, 'There was a problem commenting on Facebook.');
      t.end();
    });
  });

  t.test("when fb returns non-JSON 200 response", function(t) {
    body = "I AM NOT JSON";
    status = 200;
    facebook.publishComment("obj_id", "access_token", "hi", function(err) {
      t.equal(err, 'There was a problem commenting on Facebook.');
      t.end();
    });
  });

  t.test("when fb returns JSON 200 response", function(t) {
    body = {id: 15};
    status = 200;
    facebook.publishComment("obj_id", "access_token", "hi", function(err, id) {
      t.equal(err, null);
      t.equal(id, 15);
      t.end();
    });
  });  
}));

test("extendUserAccessToken() works", withFakeGraphServer(function(t, graph) {
  var body, status;

  graph.app.post('/oauth/access_token', function(req, res) {
    t.same(req.query, {
      grant_type: "fb_exchange_token",
      client_id: "appid",
      client_secret: "secret",
      fb_exchange_token: "token"
    });
    return res.send(body, status);
  });

  t.test("when fb is nice", function(t) {
    body = querystring.stringify({access_token: "newtoken"});
    status = 200;
    facebook.extendUserAccessToken("appid", "secret", "token", function(err, token) {
      t.equal(err, null);
      t.equal(token, "newtoken");
      t.end();
    });
  });

  t.test("when fb is mean", function(t) {
    body = "NO U";
    status = 500;
    facebook.extendUserAccessToken("appid", "secret", "token", function(err, token) {
      t.equal(err, "There was an error extending a user access token from Facebook.");
      t.end();
    });
  });
}));

test("checkApplicationAccess() works", withFakeGraphServer(function(t, graph) {
  var body, status;

  graph.app.get('/me/permissions', function(req, res) {
    t.same(req.query, {
      access_token: 'access',
      app_id: 'appid'
    });
    return res.send(body, status);
  });

  t.test("when access is valid", function(t) {
    body = {data: [{installed: 1, publish_actions: 1}]};
    status = 200;
    facebook.checkApplicationAccess("access", "appid", function(err, valid) {
      t.equal(err, null);
      t.equal(valid, true);
      t.end();
    });
  });

  t.test("when access is invalid", function(t) {
    body = {data: [{installed: 1, publish_actions: 0}]};
    status = 200;
    facebook.checkApplicationAccess("access", "appid", function(err) {
      t.equal(err, 'Incorrect Facebook permissions for the application to publish and access information.');
      t.end();
    });
  });

  t.test("when fb is mean", function(t) {
    body = "NO U";
    status = 500;
    facebook.checkApplicationAccess("access", "appid", function(err) {
      t.equal(err, 'There was an error checking if the Facebook application has permission.');
      t.end();
    });
  });
}));

