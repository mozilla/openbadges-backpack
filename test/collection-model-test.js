var vows = require('vows'),
    assert = require('assert'),
    mysql = require('../lib/mysql'),
    Collection = require('../models/collection');

var createDbFixtures = function (callback) {
  var addUser = "INSERT INTO `user` (email) VALUES ('brian@example.com')";
  var addBadge1 = "INSERT INTO `badge`"
    + "(user_id, type, endpoint, image_path, body, body_hash)"
    + "VALUES"
    + "(1, 'hosted', 'http://example.com', '/dev/null', '{\"wut\":\"lol\"}', 'sha256$lol')";
  var addBadge2 = "INSERT INTO `badge`"
    + "(user_id, type, endpoint, image_path, body, body_hash)"
    + "VALUES"
    + "(1, 'hosted', 'http://example.com/yaaaa.json', '/dev/null', '{\"dummy\":\"data\"}', 'sha256$rad')";
  mysql.client.query(addUser);
  mysql.client.query(addBadge1);
  mysql.client.query(addBadge2, callback);
};

vows.describe('Collllleccctions').addBatch({
  'Collection testing:': {
    topic: function () {
      mysql.prepareTesting();
      createDbFixtures(this.callback);
    },
    'A valid new collection': {
      topic: function () {
        return new Collection({
          user_id: 1,
          name: 'test collection',
          url: 'whaaaaat'
        })
      },
      'can be saved': {
        topic: function (collection) {
          collection.save(this.callback)
        },
        'without errors': function (err, collection) {
          assert.ifError(err);
          assert.isObject(collection);
          console.dir(collection);
        }
      }
    }
  }
}).export(module);