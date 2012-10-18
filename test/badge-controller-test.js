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
    '#privacy: given no user ': {
      'topic' : function () {
        var req = { badge: badgeRaw, value: false };
        conmock(badgecontroller.privacy, req, this.callback);
      },
      'get back status 403' : function (err, mock) {
        mock.status.should.equal(403);
        mock.body.status = 'forbidden';
      },
    },
    '#privacy: given wrong user ': {
      'topic' : function () {
        var req = { user: otherUser, badge: badgeRaw, value: false };
        conmock(badgecontroller.privacy, req, this.callback);
      },
      'get back status 403' : function (err, mock) {
        mock.status.should.equal(403);
        mock.body.status = 'forbidden';
      },
    },
    '#privacy: given no badge': {
      'topic' : function () {
        var req = { user: user, value: false };
        conmock(badgecontroller.privacy, req, this.callback);
      },
      'get back status 404' : function (err, mock) {
        mock.status.should.equal(404);
        mock.body.status = 'missing';
      },
    },
    '#privacy: given correct user and a raw email badge with privacy false': {
      'topic' : function () {
        var req = { user: user, badge: badgeRaw, value: false };
        conmock(badgecontroller.privacy, req, this.callback);
      },
      'get back status 200' : function (err, mock) {
        mock.status.should.equal(200);
        mock.body.status = 'okay';
      },
    },
    '#privacy: given correct user and a raw email badge with privacy true': {
      'topic' : function () {
        var req = { user: user, badge: badgeRaw, value: true };
        conmock(badgecontroller.privacy, req, this.callback);
      },
      'get back status 200' : function (err, mock) {
        mock.status.should.equal(200);
        mock.body.status = 'okay';
      },
    },
    '#privacy: given correct user and a raw email badge with non-boolean privacy': {
      'topic' : function () {
        var req = { user: user, badge: badgeRaw, value: "18x" };
        conmock(badgecontroller.privacy, req, this.callback);
      },
      'get back status 500' : function (err, mock) {
        mock.status.should.equal(500);
      },
    },
    '#privacy: given correct user and a hashed email badge with privacy false': {
      'topic' : function () {
        var req = { user: user, badge: badgeHash, value: false };
        conmock(badgecontroller.privacy, req, this.callback);
      },
      'get back status 200' : function (err, mock) {
        mock.status.should.equal(200);
        mock.body.status = 'okay';
      },
    },
    '#privacy: given correct user and a hashed email badge with privacy true': {
      'topic' : function () {
        var req = { user: user, badge: badgeHash, value: true };
        conmock(badgecontroller.privacy, req, this.callback);
      },
      'get back status 200' : function (err, mock) {
        mock.status.should.equal(200);
        mock.body.status = 'okay';
      },
    },
    '#privacy: given correct user and a hashed email badge with non-boolean privacy': {
      'topic' : function () {
        var req = { user: user, badge: badgeHash, value: 1 };
        conmock(badgecontroller.privacy, req, this.callback);
      },
      'get back status 500' : function (err, mock) {
        mock.status.should.equal(500);
      },
    },
    '#privacy: request for text/html': {
      'topic': function() {
        var req = { user: user, badge: badgeHash, headers: { accept: ['text/html'] }, value: false };
        badgecontroller.privacy(req, response(req, this.callback));
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
    '#notes: given no user ': {
      'topic' : function () {
        var req = { badge: badgeRaw, text: "new notes!" };
        conmock(badgecontroller.notes, req, this.callback);
      },
      'get back status 403' : function (err, mock) {
        mock.status.should.equal(403);
        mock.body.status = 'forbidden';
      },
    },
    '#notes: given wrong user ': {
      'topic' : function () {
        var req = { user: otherUser, badge: badgeRaw, text: "new notes!" };
        conmock(badgecontroller.notes, req, this.callback);
      },
      'get back status 403' : function (err, mock) {
        mock.status.should.equal(403);
        mock.body.status = 'forbidden';
      },
    },
    '#notes: given no badge': {
      'topic' : function () {
        var req = { user: user, text: "new notes!" };
        conmock(badgecontroller.notes, req, this.callback);
      },
      'get back status 404' : function (err, mock) {
        mock.status.should.equal(404);
        mock.body.status = 'missing';
      },
    },
    '#notes: given correct user and a raw email badge with new notes': {
      'topic' : function () {
        var req = { user: user, badge: badgeRaw, text: "new notes!" };
        conmock(badgecontroller.notes, req, this.callback);
      },
      'get back status 200' : function (err, mock) {
        mock.status.should.equal(200);
        mock.body.status = 'okay';
      },
    },
    '#notes: given correct user and a raw email badge with null notes': {
      'topic' : function () {
        var req = { user: user, badge: badgeRaw, text: null };
        conmock(badgecontroller.notes, req, this.callback);
      },
      'get back status 200' : function (err, mock) {
        mock.status.should.equal(200);
        mock.body.status = 'okay';
      },
    },
    '#notes: given correct user and a raw email badge with invalid': {
      'topic' : function () {
        var req = { user: user, badge: badgeRaw, text: 100 };
        conmock(badgecontroller.notes, req, this.callback);
      },
      'get back status 500' : function (err, mock) {
        mock.status.should.equal(500);
      },
    },
    '#notes: given correct user and a hashed email badge with new notes': {
      'topic' : function () {
        var req = { user: user, badge: badgeHash, text: "new notes!" };
        conmock(badgecontroller.notes, req, this.callback);
      },
      'get back status 200' : function (err, mock) {
        mock.status.should.equal(200);
        mock.body.status = 'okay';
      },
    },
    '#notes: given correct user and a hashed email badge with null notes': {
      'topic' : function () {
        var req = { user: user, badge: badgeHash, text: null };
        conmock(badgecontroller.notes, req, this.callback);
      },
      'get back status 200' : function (err, mock) {
        mock.status.should.equal(200);
        mock.body.status = 'okay';
      },
    },
    '#notes: given correct user and a hashed email badge with invalid': {
      'topic' : function () {
        var req = { user: user, badge: badgeHash, text: false };
        conmock(badgecontroller.notes, req, this.callback);
      },
      'get back status 500' : function (err, mock) {
        mock.status.should.equal(500);
      },
    },
    '#notes: request for text/html': {
      'topic': function() {
        var req = { user: user, badge: badgeHash, headers: { accept: ['text/html'] }, text: "new notes!" };
        badgecontroller.notes(req, response(req, this.callback));
      },
      'get back status 303' : function(err, path, status) {
        status.should.equal(303);
        path.should.equal('/backpack/login');
      }
    },
  }
}).export(module);