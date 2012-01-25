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
  'When trying to save with incomplete data': {
    topic: function () { 
      var assertion = fixture({recipient: 'yo@example.com'});
      var badge = new Badge({
        body: assertion,
        body_hash: 'sha256$' + sha256(JSON.stringify(assertion))
      });
      badge.save(this.callback);
    },
    'the validation errors are given back in the error object': function (err, badge) {
      console.dir(err);
      console.dir(badge);
    }
  },
}).export(module);
