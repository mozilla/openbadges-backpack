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
      "evidence": "/badges/html5-basic/example",
      "badge": {
        "version": "0.5.0",
        "name": "HTML5 Fundamental",
        "image": "/CANT_BE_REACHED.png",
        "description": "Knows the difference between a <section> and a b",
        "criteria": "/badges/html5-basic",
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
      "evidence": "/badges/html5-basic/example",
      "badge": {
        "version": "0.5.0",
        "name": "HTML5 Fundamental",
        "image": appTestHarness.resolve('/_demo/cc.large.png'),
        "description": "Knows the difference between a <section> and a c",
        "criteria": "/badges/html5-basic",
        "issuer": {
          "origin": baseUrl,
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
