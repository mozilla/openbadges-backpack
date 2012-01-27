var vows = require('vows'),
    assert = require('assert'),
    mysql = require('../lib/mysql'),
    genstring = require('./utils').genstring,
    Collection = require('../models/collection');

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

var createCollection = function () {
  return new Collection({
    user_id: 1,
    name: 'test collection',
    url: genstring(64)
  })
};
vows.describe('Collllleccctions').addBatch({
  'Collection testing:': {
    topic: function () {
      mysql.prepareTesting();
      createDbFixtures(this.callback);
    },
    'A valid new collection': {
      topic: createCollection(),
      'can be saved': {
        topic: function (collection) {
          collection.save(this.callback)
        },
        'without errors': function (err, collection) {
          assert.ifError(err);
          assert.isObject(collection);
        }
      }
    },
    'A collection' : {
      topic: createCollection(),
      'can have badges added to it before saving': {
        topic: function (collection) {
          collection.data.badges = [1,2];
          collection.save(function (err, collection) {
            collection.getBadgeObjects(this.callback);
          }.bind(this))
        },
        'and have them be there when retrieving': function (err, badges) {
          assert.equal(badges.length, 2);
        }
      }
    }
  }
}).export(module);