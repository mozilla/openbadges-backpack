var vows = require('vows')
  , mysql = require('../lib/mysql')
  , assert = require('assert')
  , makeAssertion = require('./utils').fixture
  , genstring = require('./utils').genstring
  , Badge = require('../models/badge')

var EMAILS = {
  good: ['brian@awesome.com', 'yo+wut@example.com', /*'elniño@español.es',*/ 'ümlaut@heavymetal.de'],
  bad: ['lkajd', 'skj@asdk', '@.com', '909090', '____!@']
};
var URLS = {
  good: ['http://example.com/', 'https://example.com/w/yo', '/partial/path', '/rad.awesome/great/', '/foreign/crázy/ååú´¨la/'],
  bad: ['-not-asdo', 'ftp://bad-scheme', '@.com:90/', 'just totally wrong']
};
var ORIGINS = {
  good: ['http://example.com', 'https://example.com:80', 'https://www.example.com', 'https://www.example.com:8080'],
  bad: URLS.bad
};
var DATES = {
  good: [Math.floor(Date.now()/1000), '2012-01-01'],
  bad: ['oiajsd09gjas;oj09', 'foreever ago', '@.com:90/', '2001-10-190-19', '901d1', '000000000000000000000']
};                                                                                                             
var VERSIONS = {
  good: ['0.1.1', '2.0.1', '1.2.3', 'v1.2.1'],
  bad: ['v100', '50', 'v10.1alpha', '1.2.x']
};

var makeBadge = function () {
  var assertion = makeAssertion();
  return new Badge({
    type: 'hosted',
    endpoint: 'http://example.com/awesomebadge.json',
    image_path: '/dev/null',
    body: assertion,
    body_hash: 'sha256$' + genstring(64)
  });
};

var makeBadgeAndSave = function (changes) {
  var badge = makeBadge();
  changes = changes || {};
  Object.keys(changes).forEach(function (k) {
    if (changes[k] === null) { delete badge.data[k]; }
    else { badge.data[k] = changes[k]; }
  })
  return function () { 
    badge.save(this.callback);
  }
};

var assertErrors = function (fields, msgContains) {
  return function (err, badge) {
    if (badge instanceof Error) {
      err = badge;
      badge = null;
    }
    assert.isNull(badge);
    assert.instanceOf(err, Error);
    assert.isObject(err.fields);
    fields.forEach(function (f) {
      assert.includes(err.fields, f);
      assert.match(err.fields[f], RegExp(f));
      if (msgContains) {
        assert.match(err.fields[f], RegExp(msgContains));
      }
    })

  }
};

var makeInvalidationTests = function (field, badData) {
  var tests = {};
  badData.forEach(function (v) {
    var test = tests['like "' + v + '"'] = {}
    test['topic'] = function () {
      var fieldReplacement = {}
      fieldReplacement[field] = v;
      return Badge.validateBody(makeAssertion(fieldReplacement));
    };
    test['should fail with error on `' + field + '`'] = assertErrors([field], 'invalid');
  })
  return tests;
};
var makeValidationTests = function (field, goodData) {
  var tests = {};
  goodData.forEach(function (v) {
    var test = tests['like "' + v + '"'] = {}
    test['topic'] = function () {
      var fieldReplacement = {}
      fieldReplacement[field] = v;
      return Badge.validateBody(makeAssertion(fieldReplacement));
    };
    test['should succeed'] = function (err) { assert.isNull(err); };
  })
  return tests;
};
var makeMissingTest = function (field) {
  var test = {};
  test['topic'] = function () {
    var fieldReplacement = {}
    fieldReplacement[field] = null;
    return Badge.validateBody(makeAssertion(fieldReplacement));
  };
  test['should fail with error on `' + field + '`'] = assertErrors([field], 'missing');
  return test;
};
var createDbFixtures = function () {
  var addUser = "INSERT INTO `user` (email) VALUES ('brian@example.com')";
  var addBadge = "INSERT INTO `badge`"
    + "(user_id, type, endpoint, image_path, body, body_hash)"
    + "VALUES"
    + "(1, 'hosted', 'http://example.com', '/dev/null', 'wut', 'sha256$lol')";
  mysql.client.query(addUser);
  mysql.client.query(addBadge);
};

var assertFixtureBadge = function (err, results) {
  var badge;
  assert.ifError(err);
  assert.isArray(results);
  badge = results.pop();
  assert.equal(badge.data.body_hash, 'sha256$lol');
}

mysql.prepareTesting();
createDbFixtures();

vows.describe('Badggesss').addBatch({
  'Finding badges': {
    'by user id': {
      topic: function () {
        Badge.find({user_id: 1}, this.callback);
      },
      'should retrieve the right badge': assertFixtureBadge
    },
    'by email address': {
      topic: function () {  
        Badge.find({email: 'brian@example.com'}, this.callback);
      },
      'should retrieve the right badge': assertFixtureBadge
    }
  },
  'Validating an assertion': {
    'with a missing `recipient` field': makeMissingTest('recipient'),
    'with a missing `badge` field': makeMissingTest('badge'),
    'with a missing `badge.version` field': makeMissingTest('badge.version'),
    'with a missing `badge.name` field': makeMissingTest('badge.name'),
    'with a missing `badge.description` field': makeMissingTest('badge.description'),
    'with a missing `badge.image` field': makeMissingTest('badge.image'),
    'with a missing `badge.criteria` field': makeMissingTest('badge.criteria'),
    'with a missing `badge.issuer` field': makeMissingTest('badge.issuer'),
    'with a missing `badge.issuer.origin` field': makeMissingTest('badge.issuer.origin'),
    'with a missing `badge.issuer.name` field': makeMissingTest('badge.issuer.name'),
    
    'with bogus `recipient`': makeInvalidationTests('recipient', EMAILS.bad),
    'with valid `recipient`': makeValidationTests('recipient', EMAILS.good),
    
    'with bogus `evidence`': makeInvalidationTests('evidence', URLS.bad),
    'with valid `evidence`': makeValidationTests('evidence', URLS.good),
    
    'with bogus `expires`': makeInvalidationTests('expires', DATES.bad),
    'with valid `expires`': makeValidationTests('expires', DATES.good),
    
    'with bogus `issued_on`': makeInvalidationTests('issued_on', DATES.bad),
    'with valid `issued_on`': makeValidationTests('issued_on', DATES.good),

    'with bogus `badge.version`': makeInvalidationTests('badge.version', VERSIONS.bad),
    'with valid `badge.version`': makeValidationTests('badge.version', VERSIONS.good),
    
    'with bogus `badge.name`': makeInvalidationTests('badge.name', [genstring(129)] ),
    'with valid `badge.name`': makeValidationTests('badge.name', [genstring(127)] ),
    
    'with bogus `badge.description`': makeInvalidationTests('badge.description', [genstring(129)] ),
    'with valid `badge.description`': makeValidationTests('badge.description', [genstring(127)] ),
    
    'with bogus `badge.image`': makeInvalidationTests('badge.image', URLS.bad),
    'with valid `badge.image`': makeValidationTests('badge.image', URLS.good),

    'with bogus `badge.criteria`': makeInvalidationTests('badge.criteria', URLS.bad),
    'with valid `badge.criteria`': makeValidationTests('badge.criteria', URLS.good),
    
    'with bogus `badge.issuer.origin`': makeInvalidationTests('badge.issuer.origin', ORIGINS.bad),
    'with valid `badge.issuer.origin`': makeValidationTests('badge.issuer.origin', ORIGINS.good),
    
    'with bogus `badge.issuer.name`': makeInvalidationTests('badge.issuer.name', [genstring(129)] ),
    'with valid `badge.issuer.name`': makeValidationTests('badge.issuer.name', [genstring(127)] ),
    
    'with bogus `badge.issuer.org`': makeInvalidationTests('badge.issuer.org', [genstring(129)] ),
    'with valid `badge.issuer.org`': makeValidationTests('badge.issuer.org', [genstring(127)] ),
    
    'with bogus `badge.issuer.contact`': makeInvalidationTests('badge.issuer.contact', EMAILS.bad ),
    'with valid `badge.issuer.contact`': makeValidationTests('badge.issuer.contact', EMAILS.good ),
    
    'that is totally valid': {
      topic: function () {
        return Badge.validateBody(makeAssertion({}))
      },
      'should succeed': function (err) {
        assert.isNull(err);
      }
    }
  },
  'Trying to save': {
    'a valid hosted assertion': {
      topic: makeBadgeAndSave(),
      'saves badge into the database and gives an id': function (err, badge) {
        assert.ifError(err);
        assert.isNumber(badge.data.id);
      }
    },

    'a hosted assertion without an `endpoint`': {
      topic: makeBadgeAndSave({endpoint: null}),
      'should fail with validation error on `endpoint`': assertErrors(['type', 'endpoint'])
    },

    'a signed assertion without a `jwt`': {
      topic: makeBadgeAndSave({type: 'signed', jwt: null}),
      'should fail with validation error on `jwt`': assertErrors(['type', 'jwt'])
    },

    'an assertion with an unknown type': {
      topic: makeBadgeAndSave({type: 'glurble'}),
      'should fail with validation error on `type`': assertErrors(['type'])
    },

    'an assertion without an `image_path`': {
      topic: makeBadgeAndSave({image_path: null}),
      'should fail with validation error on `image_path`': assertErrors(['image_path'])
    },

    'an assertion without a `body`': {
      topic: makeBadgeAndSave({body: null}),
      'should fail with validation error on `body`': assertErrors(['body'])
    },
    
    'an assertion with an unexpected `body` type': {
      topic: makeBadgeAndSave({body: "I just don't understand skrillex"}),
      'should fail with validation error on `body`': assertErrors(['body'])
    },
    
    'an assertion with an invalid `body`': {
      topic: makeBadgeAndSave({body: makeAssertion({'badge': null})}),
      'should fail with validation error on `body`': assertErrors(['body'])
    }
  }
}).export(module);
