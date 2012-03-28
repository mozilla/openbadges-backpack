var vows = require('vows');
var assert = require('assert');
var should = require('should');
var conmock = require('./conmock.js');
var displayer = require('../controllers/displayer.js');

var user, badge, group, otherGroup;
function setupDatabase (callback) {
  var User = require('../models/user.js')
  var Badge = require('../models/badge.js')
  var Group = require('../models/group.js')
  var badgedata = require('../lib/utils').fixture({recipient: 'brian@example.com'})
  var map = require('functools').map;
  function saver (m, cb) { m.save(cb) };
  require('../lib/mysql.js').prepareTesting();
  
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
    name: 'Public Group',
    url: 'Public URL',
    'public': 1,
    badges: [1]
  });
  otherGroup = new Group({
    user_id: 1,
    name: 'Private Group',
    url: 'Private URL',
    'public': 0,
    badges: [1]
  });
  map.async(saver, [user, badge, group, otherGroup], callback);
}

vows.describe('displayer controller tests').addBatch({
  'displayer' : {
    topic: function () {
      setupDatabase(this.callback);
    },
    
    '#version' : {
      topic: function () {
        conmock(displayer.version, {}, this.callback);
      },
      'should 200, return API version' : function (err, mock) {
        // #TODO: don't hardcode this. hell, maybe don't even include it.
        mock.status.should.equal(200);
        mock.body['version'].should.equal('0.5.0');
      },
    },
    
    '#emailToUserId' : {
      'given an email address in query' : {
        topic: function () {
          var req = { body: { email: 'brian@example.com'  } };
          conmock(displayer.emailToUserId, req, this.callback);
        },
        'return 200, proper user id' : function (err, mock) {
          mock.status.should.equal(200);
          mock.body['email'].should.equal('brian@example.com');
          mock.body['userId'].should.equal(1);
        },
      },
      'given no email address to convert' : {
        topic : function () {
          conmock(displayer.emailToUserId, {}, this.callback);
        },
        'return 400, error message' : function (err, mock) {
          mock.status.should.equal(400);
          mock.body.error.should.match(/missing/);
        }
      },
      'given an email address not in the database' : {
        topic : function () {
          var req = { body: { email: 'kangaroo@example.com'  } };
          conmock(displayer.emailToUserId, req, this.callback);
        },
        'return 404, error message' : function (err, mock) {
          mock.status.should.equal(404);
          mock.body.error.should.match(/find/);
        }
      }
    },

    '#userGroups': {
      'given a userId, no callback': {
        topic: function () {
          var req = { params: { userId: 1 }, paramUser: user };
          conmock(displayer.userGroups, req, this.callback);
        },
        'return 200, group data' : function (err, mock) {
          mock.status.should.equal(200);
          mock.body['userId'].should.equal(1);
          mock.body['groups'].length.should.equal(1);
          var group = mock.body['groups'][0];

          group.name.should.equal('Public Group');
          group.badges.should.equal(1);
        },
      }
    }
  }
}).export(module)
