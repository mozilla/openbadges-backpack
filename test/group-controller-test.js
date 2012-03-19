var _ = require('underscore')
  , app = require('../app.js')
  , vows = require('vows')
  , assert = require('assert')
  , should = require('should')
  , mysql = require('../lib/mysql.js')
  , map = require('functools').map
  , conmock = require('./conmock.js')

var user, badge, group;
function setupDatabase (callback) {
  var User = require('../models/user.js')
  var Badge = require('../models/badge.js')
  var Group = require('../models/group.js')
  var badgedata = require('../lib/utils').fixture({recipient: 'brian@example.com'})
  mysql.prepareTesting();
  function saver (m, cb) { m.save(cb) };
  user = new User({ email: 'brian@example.com' })
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
  map.async(saver, [user, badge, group], callback);
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
        mock.body.id.should.equal(2);
        should.exist(mock.body.url);
        mock.body.url.length.should.be.greaterThan(10);
      }
    },
  },
}).export(module);
