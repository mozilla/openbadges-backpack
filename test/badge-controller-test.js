var map = require('functools').map;
var vows = require('vows');
var assert = require('assert');
var should = require('should');
var conmock = require('./conmock.js');
var mysql = require('../lib/mysql.js')

var user, otherUser, badgeRaw, badgeHash;

function makeHash (email, salt) {
  var sha = require('crypto').createHash('sha256');
  return 'sha256$' + sha.update(email + salt).digest('hex');
}

function setupDatabase (callback) {
  var fixture = require('../lib/utils').fixture;
  var User = require('../models/user.js')
  var Badge = require('../models/badge.js')
  function saver (m, cb) { m.save(cb) };
  mysql.prepareTesting(function() {
    user = new User({ email: 'brian@example.com' })
  
    otherUser = new User({ email: 'liar@thief.co.uk' })
    
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
    
    map.async(saver, [user, otherUser, badgeRaw, badgeHash], callback);
  });
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
        mock.body.status = 'forbidden';
      },
    },
    '#destroy: given wrong user ': {
      'topic' : function () {
        var req = { user: otherUser, badge: badgeRaw };
        conmock(badgecontroller.destroy, req, this.callback);
      },
      'get back status 403' : function (err, mock) {
        mock.status.should.equal(403);
        mock.body.status = 'forbidden';
      },
    },
    '#destroy: given no badge': {
      'topic' : function () {
        var req = { user: user };
        conmock(badgecontroller.destroy, req, this.callback);
      },
      'get back status 404' : function (err, mock) {
        mock.status.should.equal(404);
        mock.body.status = 'missing';
      },
    },
    '#destroy: given correct user and a raw email badge': {
      'topic' : function () {
        var req = { user: user, badge: badgeRaw };
        conmock(badgecontroller.destroy, req, this.callback);
      },
      'get back status 200' : function (err, mock) {
        mock.status.should.equal(200);
        mock.body.status = 'okay';
      },
    },
    '#destroy: given correct user and a hashed email badge': {
      'topic' : function () {
        var req = { user: user, badge: badgeHash };
        conmock(badgecontroller.destroy, req, this.callback);
      },
      'get back status 200' : function (err, mock) {
        mock.status.should.equal(200);
        mock.body.status = 'okay';
      },
    }
  }
}).export(module);