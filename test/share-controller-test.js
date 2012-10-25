var map = require('functools').map;
var vows = require('vows')
var assert = require('assert')
var should = require('should')
var conmock = require('./conmock.js')
var sharecontroller = require('../controllers/share.js')

var User = require('../models/user.js')
var Badge = require('../models/badge.js')
var Group = require('../models/group.js')
var Portfolio = require('../models/portfolio.js')

var user, otherUser, badge, group, otherGroup, portfolio;
function setupDatabase (callback) {
  var mysql = require('../lib/mysql.js')
  var badgedata = require('../lib/utils').fixture({recipient: 'brian@example.com'})  
  function saver (m, cb) { m.save(cb) };
  mysql.prepareTesting(function() {
    user = new User({ email: 'brian@example.com' })
    otherUser = new User({ email: 'lolwut@example.com' })
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
      'public': 0,
      badges: [1]
    });
    otherGroup = new Group({
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
    map.async(saver, [user, otherUser, badge, group, otherGroup, portfolio], callback);
  });
}

vows.describe('group controller test').addBatch({
  'setup' : {
    topic: function () {
      setupDatabase(this.callback);
    },
    '#createOrUpdate': {
      topic : function () { return sharecontroller.createOrUpdate },
      'when given no user' : {
        topic : function (route) {
          var req = { }
          conmock(route, req, this.callback)
        },
        'respond with 403' : function (err, mock) {
          mock.status.should.equal(403);
        },
      },
      'when given the wrong user for the group': {
        topic : function (route) {
          var req = { user: otherUser, group: group }
          conmock(route, req, this.callback)
        },
        'respond with 403' : function (err, mock) {
          mock.status.should.equal(403);
        },
      },
    }
  },
}).export(module);