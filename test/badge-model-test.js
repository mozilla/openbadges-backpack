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

mysql.prepareTesting();
vows.describe('Badggesss').addBatch({
  'Trying to save': {
    
    topic: function () {
      var assertion = fixture();
      return new Badge({
        type: 'hosted',
        endpoint: 'http://example.com/awesomebadge.json',
        image_path: '/dev/null',
        body: assertion,
        body_hash: 'sha256$' + genstring(64)
      });
    },
    
    'a valid hosted assertion': {
      topic: function (badge) {
        badge.save(this.callback);
      },
      'saves badge into the database and gives an id': function (err, badge) {
        assert.isNumber(badge.data.id);
      }
    },

    'a hosted assertion without an `endpoint`': {
      topic: function (badge) { 
        delete badge.data.endpoint;
        badge.save(this.callback);
      },
      'should fail with validation error on `endpoint`': function (err, badge) {
        assert.instanceOf(err, Error);
        assert.includes(err.fields, 'type');
        assert.includes(err.fields, 'endpoint');
        assert.isNull(badge);
      }
    },

    'a signed assertion without a `jwt`': {
      topic: function (badge) { 
        delete badge.data.jwt;
        badge.data.type = 'signed';
        badge.save(this.callback);
      },
      'should fail with validation error on `jwt`': function (err, badge) {
        assert.instanceOf(err, Error);
        assert.includes(err.fields, 'type');
        assert.includes(err.fields, 'jwt');
        assert.isNull(badge);
      }
    },

    'an assertion without an `image_path`': {
      topic: function (badge) { 
        delete badge.data.image_path;
        badge.save(this.callback);
      },
      'should fail with validation error on `image_path`': function (err, badge) {
        assert.instanceOf(err, Error);
        assert.includes(err.fields, 'image_path');
        assert.isNull(badge);
      }
    },

    'an assertion without a `body`': {
      topic: function (badge) { 
        delete badge.data.body;
        badge.save(this.callback);
      },
      'should fail with validation error on `body`': function (err, badge) {
        assert.instanceOf(err, Error);
        assert.includes(err.fields, 'body');
        assert.isNull(badge);
      }
    },
    
    'an assertion with an unexpected `body` type': {
      topic: function (badge) { 
        badge.data.body = "I just don't understand skrillex";
        badge.save(this.callback);
      },
      'should fail with validation error on `body`': function (err, badge) {
        assert.instanceOf(err, Error);
        assert.includes(err.fields, 'body');
        assert.isNull(badge);
      }
    }
  }
}).export(module);
