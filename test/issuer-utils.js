const $ = require('./');
const express = require('express');
const http = require('http');
const url = require('url');

function makeHash(email, salt) {
  var sha = require('crypto').createHash('sha256');
  return 'sha256$' + sha.update(email + salt).digest('hex');
}

function makeBadges(appTestHarness, baseUrl) {
  return {
    '/bad_img': {
      "recipient": makeHash(appTestHarness.email, "ballertime"),
      "salt": "ballertime",
      "evidence": "/evidence",
      "badge": {
        "version": "0.5.0",
        "name": "HTML5 Fundamental",
        "image": "/CANT_BE_REACHED.png",
        "description": "Knows the difference between a <section> and a b",
        "criteria": "/criteria",
        "issuer": {
          "origin": baseUrl,
          "name": "P2PU",
          "org": "School of Webcraft",
          "contact": "admin@p2pu.org"
       }
      }
    },
    '/example': {
      "recipient": makeHash(appTestHarness.email, "ballertime"),
      "salt": "ballertime",
      "evidence": "/evidence",
      "badge": {
        "version": "0.5.0",
        "name": "HTML5 Fundamental",
        "image": appTestHarness.resolve('/_demo/cc.large.png'),
        "description": "Knows the difference between a <section> and a c",
        "criteria": "/criteria",
        "issuer": {
          "origin": baseUrl,
          "name": "P2PU",
          "org": "School of Webcraft",
          "contact": "admin@p2pu.org"
        }
      }
    },
    '/bad_assertion': {
      "salt": "ballertime",
      "evidence": "/evidence",
      "badge": {
        "version": "0.5.0",
        "image": appTestHarness.resolve('/_demo/cc.large.png'),
        "description": "Knows the difference between a <section> and a c",
        "criteria": "/CANT_BE_REACHED",
        "issuer": {
          "name": "P2PU",
          "org": "School of Webcraft",
          "contact": "admin@p2pu.org"
        }
      }
    }
  };
}

exports.createIssuer = function createIssuer(appTestHarness, cb) {
  var issuerApp = express();
  var issuerServer = http.createServer(issuerApp);
  issuerServer.listen(0, function() {
    var PORT = issuerServer.address().port;
    var HOSTNAME = 'localhost';
    var HOST = HOSTNAME + ':' + PORT;
    var PROTOCOL = 'http:';
    var BASE_URL = PROTOCOL + '//' + HOST;
    var BADGES = makeBadges(appTestHarness, BASE_URL);
    var resolve = function(path) { return url.resolve(BASE_URL, path); };

    Object.keys(BADGES).forEach(function(path) {
      issuerApp.get(path, function(req, res) {
        return res.send(BADGES[path]);
      });
    });
    issuerApp.get('/', function(req, res) {
      return res.send('origin');
    }).get('/criteria', function(req, res) {
      return res.send('criteria');
    }).get('/evidence', function(req, res) {
      return res.send('evidence');
    }).get('/badge', function (req, res) {
      return res.json($.makeBadgeClass({resolve: resolve}));
    }).get('/issuer', function (req, res) {
      return res.send($.makeIssuer({resolve: resolve}));
    }).get('/assertion-image', function (req, res) {
      res.type('image/png');
      return res.send($.makeImage());
    }).get('/badge-image', function (req, res) {
      res.type('image/png');
      return res.send($.makeImage());
    }).get('/public-key', function (req, res) {
      return res.send($.keys.public);
    });

    cb({
      BADGES: BADGES,
      PROTOCOL: PROTOCOL,
      PORT: PORT,
      HOST: HOST,
      HOSTNAME: HOSTNAME,
      BASE_URL: BASE_URL,
      app: issuerApp,
      server: issuerServer,
      resolve: resolve,
      end: function() {
        appTestHarness.t.test("shut down issuer server", function(t) {
          issuerServer.close();
          t.end();
        });
      }
    });
  });
}
