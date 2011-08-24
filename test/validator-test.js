var vows = require('vows')
  , assert = require('assert')
  , validate = require('../validator').validate

var genstring = function(length) {
  var alphanum = 'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      str = [],
      ind = 0;
  for (var i = 0; i < length; i += 1) {
    ind = Math.floor(Math.random() * (alphanum.length - 1))
    str.push(alphanum[ind]);
  }
  return str.join('');
}

var fixture = function(changes){
  changes = changes || {}
  var f = {
    recipient: 'bimmy@example.com',
    evidence: '/bimmy-badge.json',
    expires: '2040-08-13',
    issued_at: '2011-08-23',
    badge: {
      version: 'v0.5.0',
      name: 'HTML5',
      description: 'For rocking in the free world',
      image: '/html5.png',
      criteria: 'http://example.com/criteria.html',
      issuer: {
        name: 'p2pu',
        org: 'school of webcraft',
        contact: 'admin@p2pu.org',
        url: 'http://p2pu.org/schools/sow'
      }
    }
  }
  function makeChange(_base, _changes) {
    Object.keys(_changes).forEach(function(k){
      if (typeof _changes[k] === 'object') {
        makeChange(_base[k], _changes[k]);
      } else {
        _base[k] = _changes[k];
      }
    })
  }
  makeChange(f, changes);
  return f;
};

var generateErrorTests = function(field, errType, badData) {
  var tests = {}, currentTest;
  for (var i = 0; i < badData.length; i += 1) {
    var hierarchy = field.split('.');
    var changes = {}, struct, currentField;
    changes[hierarchy.pop()] = badData[i];
    for (var j = hierarchy.length - 1; j >= 0; j--) {
      struct = {};
      struct[hierarchy[j]] = changes;
      changes = struct;
    }
    currentTest = tests['“' + badData[i] + '”'] = {}
    currentTest['topic'] = fixture(changes);
    currentTest['should fail with `' +  errType + '` error'] = function(topic) {
      var result = validate(topic);
      assert.include(result.error, field);
      assert.equal(result.error[field], errType);
    }
  }
  return tests;
}

var BAD_EMAILS = ['lkajd', 'skj@asdk', '@.com', '909090', '____!@']
var BAD_URLS = ['-not-asdo', 'ftp://bad-scheme', '@.com:90/']
var BAD_DATES = ['oiajsd09gjas;oj09', 'foreever ago', '111111', '1314145531', '@.com:90/']
var BAD_VERSIONS = ['v100', '50', 'v10.1alpha']

vows.describe('Badge Validator').addBatch({
  'When validating anything': {
    topic: function() { return validate({}); },
    'we get a structure': {
      'with a `status` member': function(topic) {
        assert.include(topic, 'status')
      },
      'with a `errors` member': function(topic) {
        assert.include(topic, 'error')
      }
    }
  },
  'When validating something invalid': {
    topic: function() { return validate({}); },
    'we get a bad status and errors': function(topic) {
      assert.equal(topic.status, 'failure');
      assert.ok(Object.keys(topic.error).length > 0);
    }
  },
  'Invalid badge assertion': {
    'with bad recipient': generateErrorTests('recipient', 'email', BAD_EMAILS),
    'with bad evidence': generateErrorTests('evidence', 'url', BAD_URLS),
    'with bad expires': generateErrorTests('expires', 'isodate', BAD_DATES),
    'with bad issued_at': generateErrorTests('expires', 'isodate', BAD_DATES),
    'with bad badge.version': generateErrorTests('badge.version', 'regex', BAD_VERSIONS),
    'with bad badge.name': generateErrorTests('badge.name', 'length', [genstring(500)]),
    'with bad badge.description': generateErrorTests('badge.description', 'length', [genstring(500)]),
    'with bad badge.image': generateErrorTests('badge.image', 'url', BAD_URLS),
    'with bad badge.criteria': generateErrorTests('badge.criteria', 'url', BAD_URLS),
    'with bad badge.issuer.name': generateErrorTests('badge.issuer.name', 'length', [genstring(500)]),
    'with bad badge.issuer.org': generateErrorTests('badge.issuer.org', 'length', [genstring(500)]),
    'with bad badge.issuer.contact': generateErrorTests('badge.issuer.contact', 'email', BAD_EMAILS),
    'with bad badge.issuer.url': generateErrorTests('evidence', 'url', BAD_URLS)
  }
}).export(module);
