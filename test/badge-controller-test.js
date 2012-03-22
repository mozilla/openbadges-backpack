var _ = require('underscore');
var map = require('functools').map;
var vows = require('vows');
var assert = require('assert');
var should = require('should');

var issuer = require('../controllers/issuer.js');
var conmock = require('./conmock.js');
var mysql = require('../lib/mysql.js')


var user, badgeRaw, badgeHash, group;

function makeHash (email, salt) {
  var sha = require('crypto').createHash('sha256');
  return 'sha256$' + sha.update(email + salt).digest('hex');
}

function setupDatabase (callback) {
  var fixture = require('../lib/utils').fixture;
  var User = require('../models/user.js')
  var Badge = require('../models/badge.js')
  var Group = require('../models/group.js')
  function saver (m, cb) { m.save(cb) };
  mysql.prepareTesting();
  
  user = new User({ email: 'brian@example.com' })
  badgeRaw = new Badge({
    user_id: 1,
    type: 'hosted',
    endpoint: 'endpoint',
    image_path: 'image_path',
    body_hash: 'body_hash',
    body: fixture({
      recipient: 'brian@example.com',
      criteria: '/ohsup.html'
    })
  });
  
  badgeHash = new Badge({
    user_id: 1,
    type: 'hosted',
    endpoint: 'endpoint',
    image_path: 'image_path',
    body_hash: 'body_hash',
    body: fixture({
      recipient: makeHash('brian@example.com', 'hashbrowns'),
      salt: 'hashbrowns'
    })
  });
  
  map.async(saver, [user, badgeRaw, badgeHash], callback);
}

var badgecontroller = require('../controllers/badge.js')

vows.describe('badge controller test').addBatch({
  'setup' : {
    topic: function () {
      setupDatabase(this.callback);
    },
    '#destroy: given no user ': {
      'topic' : function () {
        var req = { badge: badgeRaw };
        conmock(badgecontroller.destroy, req, this.callback);
      },
      'get back status 403' : function (err, mock) {
        mock.status.should.equal(403);
      },
    },
    '#destroy: given no badge': {
      'topic' : function () {
        var req = { user: user };
        conmock(badgecontroller.destroy, req, this.callback);
      },
      'get back status 404' : function (err, mock) {
        mock.status.should.equal(404);
      },
    },
    '#destroy: given correct user and a raw email badge': {
      'topic' : function () {
        var req = { user: user, badge: badgeRaw };
        conmock(badgecontroller.destroy, req, this.callback);
      },
      'get back status 200' : function (err, mock) {
        mock.status.should.equal(200);
      },
    },
    '#destroy: given correct user and a hashed email badge': {
      'topic' : function () {
        var req = { user: user, badge: badgeHash };
        conmock(badgecontroller.destroy, req, this.callback);
      },
      'get back status 200' : function (err, mock) {
        mock.status.should.equal(200);
      },
    }
  }
}).export(module);