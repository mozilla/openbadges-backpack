var map = require('functools').map;
var vows = require('vows');
var assert = require('assert');
var should = require('should');
var conmock = require('./conmock.js');
var mysql = require('../lib/mysql.js');
var app = require('../app.js');
var utils = require('./utils')
  , request = utils.conn.request
  , response = utils.conn.response;
var Badge = require('../models/badge.js')
var fixture = require('../lib/utils').fixture;
var User = require('../models/user.js')  

var user, otherUser, badgeRaw, badgeHash;

function makeHash (email, salt) {
  var sha = require('crypto').createHash('sha256');
  return 'sha256$' + sha.update(email + salt).digest('hex');
}

function setupDatabase (callback) {
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
    },
    '#destroy: request for text/html': {
      'topic': function() {
        var req = { user: user, badge: badgeHash, headers: { accept: ['text/html'] } };
        badgecontroller.destroy(req, response(req, this.callback));
      },
      'get back status 303' : function(err, path, status) {
        status.should.equal(303);
        path.should.equal('/backpack/login');
      }
    },
  }
}).addBatch({
  'setup' : {
    topic: function () {
      setupDatabase(this.callback);
    },
    '#update' : {
      'when missing user' : {
        topic : function () {
          var req = {}
          conmock(badgecontroller.update, req, this.callback);
        },
        'respond with 403' : function (err, mock) {
          mock.status.should.equal(403);
        },
      },
      'when missing badge': {
        topic : function () {
          var req = { user: user }
          conmock(badgecontroller.update, req, this.callback);
        },
        'respond with 404' : function (err, mock) {
          mock.status.should.equal(404);
        },
      },
      'when the given user is not the owner of the badge': {
        topic : function () {
          var req = { user: otherUser, badge: badgeHash }
          conmock(badgecontroller.update, req, this.callback);
        },
        'respond with 403' : function (err, mock) {
          mock.status.should.equal(403);
        },
      },
      'when given user and badge': {
        'but no body': {
          topic : function () {
            var req = { user: user, badge: badgeHash }
            conmock(badgecontroller.update, req, this.callback)
          },
          'respond with 400, missing required' : function (err, mock) {
            mock.status.should.equal(400)
            mock.body.status.should.equal('missing-required')
          },
        },
        'and a `notes` field': {
          topic: function() {
            this.badge = new Badge({
              user_id: 1,
              type: 'hosted',
              endpoint: 'endpoint',
              image_path: 'image_path',
              body_hash: 'body_hash',
              body: fixture({
                recipient: 'brian@example.com',
                criteria: '/ohsup1.html'
              })
            });
            var req = { user: user, badge: this.badge, body: { 'notes': 'badge notes!' } };
            conmock(badgecontroller.update, req, this.callback)
          },
          'respond with 200, update the notes field' : function (err, mock) {
            mock.status.should.equal(200)
            this.badge.get('notes').should.equal('badge notes!');
          },
        },
        'and a `public` field' : {
          topic : function () {
            this.badge = new Badge({
              user_id: 1,
              type: 'hosted',
              endpoint: 'endpoint',
              image_path: 'image_path',
              body_hash: 'body_hash',
              body: fixture({
                recipient: 'brian@example.com',
                criteria: '/ohsup2.html'
              })
            });
            this.badge.set('public', false)
            var req = { user: user, badge: this.badge, body: { 'public': true } }
            conmock(badgecontroller.update, req, this.callback)
          },
          'respond with 200, update the public boolean' : function (err, mock) {
            mock.status.should.equal(200)
            this.badge.get('public').should.equal(true)
          },
        },
      },
    }
  }
}).export(module);