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
  'Validating:': {
    'When saving a valid hosted assertion': {
      topic: function () {
        var assertion = fixture();
        var badge = new Badge({
          type: 'hosted',
          endpoint: 'http://example.com/awesomebadge.json',
          image_path: '/dev/null',
          body: assertion,
          body_hash: 'sha256$' + sha256(JSON.stringify(assertion))
        });
        badge.save(this.callback);
      },
      'the badge is saved into the database and given an id': function (err, badge) {
        assert.isNumber(badge.data.id);
      }
    },

    'Saving a hosted assertion without an `endpoint`': {
      topic: function () { 
        var assertion = fixture({recipient: 'yo@example.com'});
        var badge = new Badge({
          type: 'hosted',
          body: assertion,
          body_hash: 'sha256$' + sha256(JSON.stringify(assertion))
        });
        badge.save(this.callback);
      },
      'should fail with validation error on `endpoint`': function (err, badge) {
        assert.instanceOf(err, Error);
        assert.includes(err.fields, 'type');
        assert.includes(err.fields, 'endpoint');
        assert.isNull(badge);
      }
    },

    'Saving a signed assertion without a `jwt`': {
      topic: function () { 
        var assertion = fixture({recipient: 'yo@example.com'});
        var badge = new Badge({
          type: 'signed',
          body: assertion,
          body_hash: 'sha256$' + sha256(JSON.stringify(assertion))
        });
        badge.save(this.callback);
      },
      'should fail with validation error on `jwt`': function (err, badge) {
        assert.instanceOf(err, Error);
        assert.includes(err.fields, 'type');
        assert.includes(err.fields, 'jwt');
        assert.isNull(badge);
      }
    },

    'Saving an assertion without an `image_path`': {
      topic: function () { 
        var assertion = fixture({recipient: 'yo@example.com'});
        var badge = new Badge({
          type: 'hosted',
          endpoint: 'whaaaat',
          body: assertion,
          body_hash: 'sha256$' + sha256(JSON.stringify(assertion))
        });
        badge.save(this.callback);
      },
      'should fail with validation error on `image_path`': function (err, badge) {
        assert.instanceOf(err, Error);
        assert.includes(err.fields, 'image_path');
        assert.isNull(badge);
      }
    },

    'Saving an assertion without a `body`': {
      topic: function () { 
        var assertion = fixture({recipient: 'yo@example.com'});
        var badge = new Badge({
          type: 'hosted',
          endpoint: 'whaaaat',
          image_path: '/',
          body_hash: 'sha256$' + sha256(JSON.stringify(assertion))
        });
        badge.save(this.callback);
      },
      'should fail with validation error on `body`': function (err, badge) {
        assert.instanceOf(err, Error);
        assert.includes(err.fields, 'body');
        assert.isNull(badge);
      }
    },
    'Saving an assertion with an unexpected `body` type': {
      topic: function () { 
        var assertion = fixture({recipient: 'yo@example.com'});
        var badge = new Badge({
          type: 'hosted',
          endpoint: 'whaaaat',
          body: 'ohhhhh suppppppp',
          image_path: '/',
          body_hash: 'sha256$' + sha256(JSON.stringify(assertion))
        });
        badge.save(this.callback);
      },
      'should fail with validation error on `body`': function (err, badge) {
        assert.instanceOf(err, Error);
        assert.includes(err.fields, 'body');
        assert.isNull(badge);
      }
    },
  }
}).export(module);
