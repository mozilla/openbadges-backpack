const _ = require('underscore');
const jws = require('jws');
const fs = require('fs');
const url = require('url');
const async = require('async');
const nock = require('nock');
const mysql = require('../lib/mysql');
const migrations = require('../lib/migrations');
const keys = require('./test-keys');

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
const ORIGIN = 'https://example.org';
const FAKE_HARNESS =  {
  email: 'brian@example.org',
  resolve: function(path) {
    return url.resolve("https://example.org", path);
  }
}
exports.keys = keys;
exports.HTTP_SCOPE = nock(ORIGIN);
exports.EMAIL = FAKE_HARNESS.email;
exports.mockHttp = function mockHttp() {
  return (
    exports.HTTP_SCOPE
      .get('/').reply(200, 'root')
      .get('/404').reply(404)
      .get('/criteria').reply(200, 'criteria')
      .get('/evidence').reply(200, 'evidence')
      .get('/image').reply(200, 'image', { 'content-type': 'image/png' })
      .get('/public-key').reply(200, keys.public)
      .get('/badge-image').reply(200, 'image', { 'content-type': 'image/png' })
      .get('/assertion-image').reply(200, 'image', { 'content-type': 'image/png' })
      .get('/badge').reply(200, JSON.stringify(exports.makeBadgeClass()))
      .get('/issuer').reply(200, JSON.stringify(exports.makeIssuer()))
  )
}
exports.makeUrl = function makeUrl(path) {
  return ORIGIN + path;
}
exports.makeImage = function makeImage() {
  return fs.readFileSync(__dirname + '/data/static/_badges/image1.png');
}
exports.makeHash = function makeHash(email, salt) {
  var sha = require('crypto').createHash('sha256');
  return 'sha256$' + sha.update(email + salt).digest('hex');
}
exports.randomstring = function randomstring(length) {
  const str = [];
  while (length--)
    str.push(randomchar(ALPHABET))
  return str.join('');
};
exports.finish = function closeDatabase (test) {
  test('cleaning up', function (t) {
    mysql.client.destroy(); t.end();
  });
};
exports.prepareDatabase = function prepareDatabase(fixtures, callback) {
  if (typeof fixtures === 'function')
    callback = fixtures, fixtures = {};
  callback = callback || function(){};

  const putFixtures = insertFixtures.bind(null, fixtures);

  async.series([
    recreateDatabase,
    putFixtures,
  ], function (err, results) {
    if (err) throw err;
    callback(results[1]);
  });
};
exports.makeAssertion = function makeAssertion(changes) {
  changes = changes || {};
  var assertion = exports.makeOldAssertion();

  _.keys(changes).forEach(function (k) {
    const fields = k.split('.');
    var current = assertion;
    var previous = null;

    fields.forEach(function (f) {
      previous = current;
      current = current[f];
    });

    previous[fields.pop()] = changes[k];
  });
  return assertion;
}
exports.makeOldAssertion = function makeOldAssertion() {
  return {
    "recipient": "brian@example.org",
    "evidence": "/evidence",
    "expires": '2040-08-13',
    "issued_on": '2011-08-23',
    "badge": {
      "version": "0.5.0",
      "name": "badge-name",
      "image": '/image',
      "description": "badge-description",
      "criteria": "/criteria",
      "issuer": {
        "origin": ORIGIN,
        "name": "issuer-name",
        "org": "issuer-org",
        "contact": "admin@example.org"
      }
    }
  };
};
exports.makeNewAssertion = function makeNewAssertion(appHarness) {
  appHarness = appHarness || FAKE_HARNESS;
  return {
    "badge": appHarness.resolve('/badge'),
    "uid": "f2c20",
    "recipient": {
      "type": "email",
      "hashed": true,
      "salt": "deadsea",
      "identity": "sha256$c7ef86405ba71b85acd8e2e95166c4b111448089f2e1599f42fe1bba46e865c5"
    },
    "image": appHarness.resolve("/assertion-image"),
    "issuedOn": 1359217910,
    "verify": {
      "type": "hosted",
      "url": appHarness.resolve("/assertion")
    }
  }
}
exports.makeBadgeClass =function makeBadgeClass(appHarness) {
  appHarness = appHarness || FAKE_HARNESS;
  return {
    "image": appHarness.resolve("/badge-image"),
    "criteria": appHarness.resolve("/criteria"),
    "issuer": appHarness.resolve("/issuer"),
    "name": "Awesome Robotics Badge",
    "description": "For doing awesome things with robots that people think is pretty great.",
  }
}
exports.makeIssuer = function makeIssuer(appHarness) {
  appHarness = appHarness || FAKE_HARNESS;
  return {
    "name": "An Example Badge Issuer",
    "url": appHarness.resolve("/"),
    "email": "steved@example.org",
  }
}
exports.makeSignature = function makeSignature(appHarness) {
  appHarness = appHarness || FAKE_HARNESS;
  const assertion = exports.makeNewAssertion(appHarness);
  const email = appHarness.email;
  assertion.verify.url = appHarness.resolve('/public-key');
  assertion.verify.type = 'signed';
  assertion.recipient.identity = exports.makeHash(email, 'salt')
  assertion.recipient.hashed = true;
  assertion.recipient.salt = 'salt';
  return jws.sign({
    header: { alg: 'rs256' },
    payload: assertion,
    privateKey: keys.private
  });
}
exports.makeBadSignature = function makeSignature(whatever) {
  return jws.sign({
    header: { alg: 'rs256' },
    payload: whatever,
    privateKey: keys.private
  });
};


function recreateDatabase(callback) {
  async.series([
    mysql.dropTestDatabase,
    mysql.createTestDatabase,
    mysql.useTestDatabase,
    migrations.up
  ], function (err, results) {
    if (err) throw err;
    callback(null, results);
  });
}

function keyFromObj(obj) {
  return function (key) { return obj[key] };
}

function sortedValues(obj) {
  return _.keys(obj).sort().map(keyFromObj(obj));
}

function itemSaver(item, callback) {
  return item.save(callback);
}

function insertFixtures(fixtures, callback) {
  var items = sortedValues(fixtures);
  async.mapSeries(items, itemSaver, function (err, results) {
    if (err) throw err;
    callback(null, fixtures);
  })
}

function randomchar(charset) {
  const length = charset.length;
  return charset[Math.random() * length | 0];
}

