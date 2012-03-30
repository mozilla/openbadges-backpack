var _ = require('underscore')
var app = require('../app.js')
var vows = require('vows')
var assert = require('assert')
var should = require('should')
var mysql = require('../lib/mysql.js')
var map = require('functools').map
var conmock = require('./conmock.js')

var User = require('../models/user.js')
var Badge = require('../models/badge.js')
var Group = require('../models/group.js')
var Portfolio = require('../models/portfolio.js')

var user, otheruser, badge, group, othergroup, portfolio;
function setupDatabase (callback) {
  var badgedata = require('../lib/utils').fixture({recipient: 'brian@example.com'})
  mysql.prepareTesting();
  function saver (m, cb) { m.save(cb) };
  
  user = new User({ email: 'brian@example.com' })
  
  otheruser = new User({ email: 'lolwut@example.com' })
  
  badge = new Badge({
    user_id: 1,
    type: 'hosted',
    endpoint: 'endpoint',
    image_path: 'image_path',
    body_hash: 'body_hash',
    body: badgedata
  });
  
  group = new Group({
    user_id: 1,
    name: 'name',
    url: 'url',
    'public': 1,
    badges: [1]
  });
  
  othergroup = new Group({
    user_id: 1,
    name: 'name',
    url: 'url2',
    'public': 1,
    badges: []
  });
  
  portfolio = new Portfolio({
    group_id: 2,
    url: 'url',
    title: 'wut',
    stories: '{"1": "oh hey"}'
  });
  
  map.async(saver, [user, otheruser, badge, group, othergroup, portfolio], callback);
}

var groupcontroller = require('../controllers/group.js')
vows.describe('group controller test').addBatch({
  'setup' : {
    topic: function () {
      setupDatabase(this.callback);
    },
    '#create: given no user' : {
      topic: function () {
        conmock(groupcontroller.create, {}, this.callback);
      },
      'returns a 403 and a json object' : function (err, mock) {
        mock.status.should.equal(403);
        mock.body.error.should.match(/user/);
      },
    },
    '#create: given no body' : {
      topic: function () {
        conmock(groupcontroller.create, {user: user}, this.callback);
      },
      'returns a 400 and a json object' : function (err, mock) {
        mock.status.should.equal(400);
        mock.body.error.should.match(/body/);
      },
    },
    '#create: given no badges in the body' : {
      topic: function () {
        var req = { user: user, body: { } };
        conmock(groupcontroller.create, req, this.callback);
      },
      'returns a 400 and a json object' : function (err, mock) {
        mock.status.should.equal(400);
        mock.body.error.should.match(/badges/);
      },
    },
    '#create: given a user and correct input': {
      topic : function () {
        var req = { user: user, body: {name: 'awesometown', badges: []} }
        conmock(groupcontroller.create, req, this.callback);
      },
      'creates a new group and returns id and url': function (err, mock) {
        mock.body.id.should.equal(3);
        should.exist(mock.body.url);
        mock.body.url.length.should.be.greaterThan(10);
      }
    },
    '#destroy: given no user': {
      'topic' : function () {
        conmock(groupcontroller.destroy, { group: group }, this.callback);
      },
      'fails with a 403': function (err, mock) {
        mock.status.should.equal(403);
      }
    },
    '#destroy: given no group': {
      'topic' : function () {
        conmock(groupcontroller.destroy, { user: user }, this.callback);
      },
      'fails with a 404': function (err, mock) {
        mock.status.should.equal(404);
      }
    },
    '#destroy: given the wrong user': {
      'topic' : function () {
        var req = { group: group, user: otheruser };
        conmock(groupcontroller.destroy, req, this.callback);
      },
      'fails with a 403': function (err, mock) {
        mock.status.should.equal(403);
      }
    },
    '#destroy: given the right user': {
      'topic' : function () {
        var req = { group: group, user: user };
        conmock(groupcontroller.destroy, req, this.callback);
      },
      'succeeds with a 200': function (err, mock) {
        mock.status.should.equal(200);
      }
    },
    '#destroy: given an empty group with a portfolio': {
      'topic' : function () {
        var req = { group: othergroup, user: user };
        conmock(groupcontroller.destroy, req, this.callback);
      },
      'succeeds with a 200' : function (err, mock) {
        mock.status.should.equal(200);
      },
    },
  },
}).export(module);
