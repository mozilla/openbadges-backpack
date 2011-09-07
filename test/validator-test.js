var vows = require('./setup').vows
  , assert = require('assert')
  , validate = require('../lib/validator').validate
  , fixture = require('./utils').fixture
  , genstring = require('./utils').genstring

var BAD_EMAILS = ['lkajd', 'skj@asdk', '@.com', '909090', '____!@']
var BAD_URLS = ['-not-asdo', 'ftp://bad-scheme', '@.com:90/']
var BAD_DATES = ['oiajsd09gjas;oj09', 'foreever ago', '111111', '1314145531', '@.com:90/']
var BAD_VERSIONS = ['v100', '50', 'v10.1alpha']

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
      assert.include(result.errors, field);
      assert.equal(result.errors[field], errType);
    }
  }
  return tests;
}

vows.describe('Badge Validator').addBatch({
  'When validating anything': {
    topic: function() { return validate({}); },
    'we get a structure': {
      'with a `status` member': function(topic) {
        assert.include(topic, 'status')
      },
      'with a `errors` member': function(topic) {
        assert.include(topic, 'errors')
      }
    }
  },
  'When validating something invalid': {
    topic: function() { return validate({}); },
    'we get a bad status and errors': function(topic) {
      assert.equal(topic.status, 'failure');
      assert.ok(Object.keys(topic.errors).length > 0);
    }
  },
  'Invalid badge assertion': {
    'with bad recipient': generateErrorTests('recipient', 'email', BAD_EMAILS),
    'with bad evidence': generateErrorTests('evidence', 'url', BAD_URLS),
    'with bad expires': generateErrorTests('expires', 'isodate', BAD_DATES),
    'with bad issued_on': generateErrorTests('expires', 'isodate', BAD_DATES),
    'with bad badge.version': generateErrorTests('badge.version', 'regex', BAD_VERSIONS),
    'with bad badge.name': generateErrorTests('badge.name', 'length', [genstring(500)]),
    'with bad badge.description': generateErrorTests('badge.description', 'length', [genstring(500)]),
    'with bad badge.image': generateErrorTests('badge.image', 'url', BAD_URLS),
    'with bad badge.criteria': generateErrorTests('badge.criteria', 'url', BAD_URLS),
    'with bad badge.issuer.name': generateErrorTests('badge.issuer.name', 'length', [genstring(500)]),
    'with bad badge.issuer.org': generateErrorTests('badge.issuer.org', 'length', [genstring(500)]),
    'with bad badge.issuer.contact': generateErrorTests('badge.issuer.contact', 'email', BAD_EMAILS),
    'with bad badge.issuer.url': generateErrorTests('evidence', 'url', BAD_URLS)
  },
  'Valid badge assertion' : {
    'without issued_on': {
      topic: fixture({issued_on: null}),
      'should not have errors': function(topic){
        var result = validate(topic);
        assert.equal(result.status, 'success');
        assert.equal(Object.keys(result.errors).length, 0);
      }
    }
  }
}).export(module);
