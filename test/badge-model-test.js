var vows = require('vows')
  , mysql = require('../lib/mysql')
  , assert = require('assert')
  , url = require('url')
  , fixture = require('./utils').fixture
  , genstring = require('./utils').genstring
  , crypto = require('crypto')
  , Badge = require('../models/badge')
  , client = mysql.client;

var BAD_EMAILS = ['lkajd', 'skj@asdk', '@.com', '909090', '____!@']
var BAD_URLS = ['-not-asdo', 'ftp://bad-scheme', '@.com:90/']
var BAD_DATES = ['oiajsd09gjas;oj09', 'foreever ago', '111111', '1314145531', '@.com:90/']
var BAD_VERSIONS = ['v100', '50', 'v10.1alpha']
var sha256 = function (str) { return crypto.createHash('sha256').update(str).digest('hex'); }


var assertErrors = function () {
  var fields = Array.prototype.slice.call(arguments);
  return function (err, badge) {
    assert.isNull(badge);
    assert.instanceOf(err, Error);
    assert.isObject(err.fields);
    fields.forEach(function (f) { assert.includes(err.fields, f); })
  }
};

var makeBadge = function () {
  var assertion = fixture();
  return new Badge({
    type: 'hosted',
    endpoint: 'http://example.com/awesomebadge.json',
    image_path: '/dev/null',
    body: assertion,
    body_hash: 'sha256$' + genstring(64)
  });
}

mysql.prepareTesting();
vows.describe('Badggesss').addBatch({
  'Trying to save': {
    'a valid hosted assertion': {
      topic: function () {
        makeBadge().save(this.callback);
      },
      'saves badge into the database and gives an id': function (err, badge) {
        assert.isNumber(badge.data.id);
      }
    },

    'a hosted assertion without an `endpoint`': {
      topic: function () { 
        var badge = makeBadge();
        delete badge.data.endpoint;
        badge.save(this.callback);
      },
      'should fail with validation error on `endpoint`': assertErrors('type', 'endpoint')
    },

    'a signed assertion without a `jwt`': {
      topic: function () { 
        var badge = makeBadge();
        badge.data.type = 'signed';
        badge.save(this.callback);
      },
      'should fail with validation error on `jwt`': assertErrors('type', 'jwt')
    },

    'an assertion without an `image_path`': {
      topic: function () { 
        var badge = makeBadge();
        delete badge.data.image_path;
        badge.save(this.callback);
      },
      'should fail with validation error on `image_path`': assertErrors('image_path')
    },

    'an assertion without a `body`': {
      topic: function () { 
        var badge = makeBadge();
        delete badge.data.body;
        badge.save(this.callback);
      },
      'should fail with validation error on `body`': assertErrors('body')
    },
    
    'an assertion with an unexpected `body` type': {
      topic: function () { 
        var badge = makeBadge();
        badge.data.body = "I just don't understand skrillex";
        badge.save(this.callback);
      },
      'should fail with validation error on `body`': assertErrors('body')
    },
    'an assertion with an invalid `body.recipient`': {
      topic: function () { 
        var badge = makeBadge();
        badge.data.body.recipient = "he's just not my jam";
        badge.save(this.callback);
      },
      'should fail with validation error on `body.recipient`': assertErrors('body.recipient')
    }
  }
}).export(module);
