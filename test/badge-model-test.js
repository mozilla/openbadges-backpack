var vows = require('./setup')
  , assert = require('assert')
  , fixture = require('./utils').fixture
  , Badge = require('../models/badge')
  , genstring = require('./utils').genstring
  , url = require('url')

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
    currentTest['topic'] = function(){
      new Badge(fixture(changes)).validate(this.callback)
    };
    currentTest['should fail with `' +  errType + '` error'] = function(err, suc) {
      assert.ok(err);
      assert.includes(err.errors, field)
      assert.equal(err.errors[field].type, errType);
    }
  }
  return tests;
}

vows.describe('Badge Validator').addBatch({
  'When validating something invalid': {
    topic: function() { new Badge({}).validate(this.callback); },
    'we get errors': function(err, suc) {
      assert.ok(err);
      assert.instanceOf(err, Error);
    }
  },
  'Invalid badge assertion': {
    'with bad recipient': generateErrorTests('recipient', 'regexp', BAD_EMAILS),
    'with bad evidence': generateErrorTests('evidence', 'regexp', BAD_URLS),
    'with bad expires': generateErrorTests('expires', 'isodate', BAD_DATES),
    'with bad issued_on': generateErrorTests('expires', 'isodate', BAD_DATES),
    'with bad badge.version': generateErrorTests('badge.version', 'regexp', BAD_VERSIONS),
    'with bad badge.name': generateErrorTests('badge.name', 'maxlen', [genstring(500)]),
    'with bad badge.description': generateErrorTests('badge.description', 'maxlen', [genstring(500)]),
    'with bad badge.image': generateErrorTests('badge.image', 'regexp', BAD_URLS),
    'with bad badge.criteria': generateErrorTests('badge.criteria', 'regexp', BAD_URLS),
    'with bad badge.issuer.name': generateErrorTests('badge.issuer.name', 'maxlen', [genstring(500)]),
    'with bad badge.issuer.org': generateErrorTests('badge.issuer.org', 'maxlen', [genstring(500)]),
    'with bad badge.issuer.contact': generateErrorTests('badge.issuer.contact', 'regexp', BAD_EMAILS),
    'with bad badge.issuer.url': generateErrorTests('evidence', 'regexp', BAD_URLS)
  },
  'Valid badge assertion' : {
    topic: function() { return new Badge(fixture()); },
    'without issued_on': {
      topic: function(badge) { badge.issued_on = null; badge.validate(this.callback) },
      'should not have errors': function(err, succ){
        assert.equal(err, null)
      }
    },
    'can validate multiple times': {
      topic: function(badge) {
        var self = this;
        badge.validate(function(err){ new Badge(badge).validate(self.callback) })
      },
      'without errors': function(err, succ){
        assert.equal(err, null)
      }
    },
    'gets fully qualified urls from members': function(badge){
      assert.ok(url.parse(badge.evidence).hostname);
    },
    'does not change fully qualified members': function(badge){
      assert.equal(badge.criteria, badge._doc.criteria);
    },
    'can be added to groups': {
      topic: function(badge){
        badge.group('Facebook');
        badge.group('Facebook');
        badge.group('Linked In');
        return badge;
      },
      'and retrieve group from meta' : function(badge) {
        assert.ok(badge.inGroup('Facebook'));
      },
      'without duplicating groups': function(badge) {
        assert.length(badge.meta.groups.filter(function(v){ return v === 'Facebook' }), 1)
      },
      'and be removed from groups': function(badge) {
        badge.degroup('Facebook');
        assert.length(badge.meta.groups, 1);
        assert.include(badge.meta.groups, 'Linked In');
      }
    }
  },
  'Badge model': {
    topic: function(){
      var badge1 = new Badge(fixture())
        , badge2 = new Badge(fixture())
        , badge3 = new Badge(fixture())
      badge1.group('Facebook');
      
      badge2.group('Linked In');
      
      badge3.group('Twitter');
      badge3.group('Facebook');
      return [badge1, badge2, badge3]
    },
    'shoud be able to find groups of badges' : function(badges){
      var groups = Badge.groups(badges);
      assert.length(groups['Linked In'], 1);
      assert.length(groups['Twitter'], 1);
      assert.length(groups['Facebook'], 2);
    }
  }
}).export(module);
