var vows = require('vows'),
    assert = require('assert'),
    mysql = require('../lib/mysql'),
    genstring = require('../lib/utils').genstring,
    Group = require('../models/group');

var createDbFixtures = function (callback) {
  var addUser = "INSERT INTO `user` (email) VALUES ('brian@example.com')";
  var addUser2 = "INSERT INTO `user` (email) VALUES ('brian2@example.com')";
  var addBadge = "INSERT INTO `badge`"
    + "(user_id, type, endpoint, image_path, body, body_hash)"
    + "VALUES"
    + "(1, 'hosted', 'http://example.com', '/dev/null', '{\"wut\":\"lol\"}', 'sha256$lol')";
  var addBadge2 = "INSERT INTO `badge`"
    + "(user_id, type, endpoint, image_path, body, body_hash)"
    + "VALUES"
    + "(1, 'hosted', 'http://example.com/yaaaa.json', '/dev/null', '{\"dummy\":\"data\"}', 'sha256$rad')";
  mysql.client.query(addUser);
  mysql.client.query(addUser2);
  mysql.client.query(addBadge);
  mysql.client.query(addBadge2, callback);
};

var createGroup = function () {
  return new Group({
    user_id: 1,
    name: genstring(14),
    badges: [1,2]
  })
};

vows.describe('Group Model').addBatch({
  'Group testing:': {
    topic: function () {
      var callback = this.callback;
      mysql.prepareTesting(function() {
        createDbFixtures(callback);
      });      
    },
    'complete': function() {      
    },
    'A valid new group': {
      topic: createGroup(),
      'can be saved': {
        topic: function (group) {
          group.save(function (err,group) {
            Group.findById(group.get('id'), this.callback);
          }.bind(this))
        },
        'without errors': function (err, group) {
          assert.ifError(err);
          assert.isObject(group);
        },
        'without mangling the badges': function (err, group) {
          var badges = group.get('badges')
          assert.isArray(badges);
          assert.includes(badges, 1);
          assert.includes(badges, 2);
        },
        'then resaved with new name': {
          topic: function (group) {
            var oldUrl = group.get('url')
            group.set('name', 'radical');
            group.save(function (err, group) {
              this.callback(oldUrl, group.get('url'));
            }.bind(this));
          },
          'without changing the url': function (oldUrl, newUrl) {
            assert.equal(oldUrl, newUrl);
          }
        },
        'and looking up by url': {
          topic: function (group) {
            Group.findOne({url: group.get('url')}, this.callback);
          },
          'should retrieve same group': function (err, group) {
            assert.ifError(err);
            assert.equal(group.get('name'), 'radical');
          }
        }
      }
    },
    
    'Should be able to put badges into group by id' : {
      topic: function () {
        var group = createGroup()
        group.set('badges', [1,2]);
        
        group.save(function (err, group) {
          if(err) return this.callback(err)
          group.getBadgeObjects(this.callback);
        }.bind(this))
      },
      'without error': function (err, badges) {
        assert.ifError(err);
        assert.equal(badges.length, 2);
      }
    },
    
    'Should be able to put badges into group by object' : {
      topic: function () {
        var group = createGroup()
        group.set('badges', [{attributes:{id:1}}, {attributes:{id:2}}]);
        group.save(function (err, group) {
          if(err) return this.callback(err)
          group.getBadgeObjects(this.callback);
        }.bind(this))
      },
      'without error': function (err, badges) {
        assert.ifError(err);
        assert.equal(badges.length, 2);
      }
    }
  }
}).export(module);