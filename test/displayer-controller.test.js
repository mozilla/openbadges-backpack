var vows = require('vows');
var assert = require('assert');
var should = require('should');
var conmock = require('./conmock.js');
var displayer = require('../controllers/displayer.js');
var User = require('../models/user.js')
var Badge = require('../models/badge.js')
var Group = require('../models/group.js')
var map = require('functools').map;

var user, otherUser, badge, group, privateGroup;
function setupDatabase (callback) {
  var badgedata = require('../lib/utils').fixture({recipient: 'brian@example.com'})  
  function saver (m, cb) { m.save(cb) };
  require('../lib/mysql.js').prepareTesting(function() {
    user = new User({ email: 'brian@example.com' })
    otherUser = new User({ email: 'yo@example.com' })
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
    privateGroup = new Group({
      user_id: 1,
      name: 'Private Group',
      url: 'Private URL',
      'public': 0,
      badges: [1]
    });
    map.async(saver, [user, otherUser, badge, group, privateGroup], callback);
  });
}

vows.describe('displayer controller tests').addBatch({
  'displayer' : {
    topic: function () {
      setupDatabase(this.callback);
    },
    
    'param handler: dUserId': {
      'given real userId':  {
        topic: function () {
          var userId = 1;
          conmock(displayer.param['dUserId'], { }, userId, this.callback);
        },
        'returns real user' : function (err, mock) {
          var request = mock._request;
          should.exist(request.user);
          request.user.get('id').should.equal(1);
        },
      },
      
      'given missing userId' : {
        'normal request':  {
          topic: function () {
            var userId = 100;
            conmock(displayer.param['dUserId'], { }, userId, this.callback);
          },
          'returns 404, error message' : function (err, mock) {
            mock.status.should.equal(404);
            mock.body.status.should.equal('missing');
            should.not.exist(mock._request.user);
          },
        },
        
        'jsonp request':  {
          topic: function () {
            var userId = 100;
            var req = { query: { callback : 'wut' } };
            conmock(displayer.param['dUserId'], req, userId, this.callback);
          },
          'returns 200, error message' : function (err, mock) {
            mock.status.should.equal(200);
            mock.body.should.match(/missing/);
            should.not.exist(mock._request.user);
          },
        }
      }
    },
    
    'param handler: dGroupId': {
      'given real groupId':  {
        topic: function () {
          var groupId = 1;
          conmock(displayer.param['dGroupId'], { }, groupId, this.callback);
        },
        'returns real group' : function (err, mock) {
          var request = mock._request;
          should.exist(request.group);
          request.group.get('id').should.equal(1);
        },
      },
      
      'given missing groupId' : {
        'normal request':  {
          topic: function () {
            var groupId = 100;
            conmock(displayer.param['dGroupId'], { }, groupId, this.callback);
          },
          'returns 404, error message' : function (err, mock) {
            mock.status.should.equal(404);
            mock.body.status.should.equal('missing');
            should.not.exist(mock._request.group);
          },
        },
        
        'jsonp request':  {
          topic: function () {
            var groupId = 100;
            var req = { query: { callback : 'wut' } };
            conmock(displayer.param['dGroupId'], req, groupId, this.callback);
          },
          'returns 200, error message' : function (err, mock) {
            mock.status.should.equal(200);
            mock.body.should.match(/missing/);
            should.not.exist(mock._request.group);
          },
        }
      }
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
          var req = { user: user };
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
      },
      'given a userId and a jsonp callback': {
        topic: function () {
          var req = {
            url: "/yep.json",
            query: { callback : 'wutlol' },
            user: user,
          }
          conmock(displayer.userGroups, req, this.callback);
        },
        'return 200, group data' : function (err, mock) {
          mock.status.should.equal(200);
          mock.body.should.match(/^wutlol\(/);
        },
      },
      'given a missing userId and a jsonp callback': {
        topic: function () {
          var req = {
            url: "/yep.json",
            query: { callback : 'wutlol' },
            user: new User({ email: 'unsaved@example.com' })
          }
          conmock(displayer.userGroups, req, this.callback);
        },
        'return 200, `missing` status' : function (err, mock) {
          mock.status.should.equal(200);
          mock.body.should.match(/^wutlol\(/);
          mock.body.should.match(/missing/);
        },
      },
      'given some strange format': {
        topic: function () {
          var req = {
            url: "/yep.umad",
            user: user,
            headers: { 'accept' : '*/*' }
          }
          conmock(displayer.userGroups, req, this.callback);
        },
        'do not crash, return 400' : function (err, mock) {
          mock.status.should.equal(400);
          mock.body.should.match(/format/);
        },
      }
      
    },
    '#userGroupBadges' : {
      'given a valid, public group': {
        'normal request' : {
          topic: function () {
            var req = { user: user, group: group }
            conmock(displayer.userGroupBadges, req, this.callback)
          },
          'return 200, sweet sweet data' : function (err, mock) {
            mock.status.should.equal(200)
            mock.body.badges.length.should.equal(1)
            var badge = mock.body.badges[0] 
            badge.hostedUrl = 'endpoint'
            badge.assertionType = 'hosted'
          },
        },
        'jsonp request' : {
          topic: function () {
            var req = { user: user, group: group, query: { callback: 'saucesome' } }
            conmock(displayer.userGroupBadges, req, this.callback)
          },
          'return 200, sweet sweet data' : function (err, mock) {
            mock.status.should.equal(200)
            mock.body.should.match(/^saucesome\(/)
          },
        }
      },
      'given a valid, private group': {
        'normal request' : {
          topic: function () {
            var req = { user: user, group: privateGroup }
            conmock(displayer.userGroupBadges, req, this.callback)
          },
          'return 404, public group not found' : function (err, mock) {
            mock.status.should.equal(404)
          },
        },
        'jsonp request' : {
          topic: function () {
            var req = { user: user, group: group, query: { callback: 'saucesome' } }
            conmock(displayer.userGroupBadges, req, this.callback)
          },
          'return 200, sweet sweet data' : function (err, mock) {
            mock.status.should.equal(200)
            mock.body.should.match(/^saucesome\(/)
          },
        },
      },
    },
  }
}).export(module)
