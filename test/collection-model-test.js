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
    name: genstring(14),
    badges: [1,2]
  })
};

vows.describe('Collection Model').addBatch({
  'Collection testing:': {
    topic: function () {
      mysql.prepareTesting();
      createDbFixtures(this.callback);
    },
    'A valid new collection': {
      topic: createCollection(),
      'can be saved': {
        topic: function (collection) {
          collection.save(function (err,collection) {
            Collection.findById(collection.data.id, this.callback);
          }.bind(this))
        },
        'without errors': function (err, collection) {
          assert.ifError(err);
          assert.isObject(collection);
        },
        'without mangling the badges': function (err, collection) {
          assert.isArray(collection.data.badges);
          assert.includes(collection.data.badges, 1);
          assert.includes(collection.data.badges, 2);
        },
        'then resaved with new name': {
          topic: function (collection) {
            var oldUrl = collection.data.url
            collection.data.name = 'radical';
            collection.save(function (err, collection) {
              this.callback(oldUrl, collection.data.url);
            }.bind(this));
          },
          'without changing the url': function (oldUrl, newUrl) {
            assert.equal(oldUrl, newUrl);
          }
        },
        'and looking up by url': {
          topic: function (collection) {
            Collection.findOne({url: collection.data.url}, this.callback);
          },
          'should retrieve same collection': function (err, collection) {
            assert.ifError(err);
            assert.equal(collection.data.name, 'radical');
          }
        }
      }
    },
    'Should be able to put badges into collection by id' : {
      topic: function () {
        var collection = createCollection()
        collection.data.badges = [1,2];
        collection.save(function (err, collection) {
          collection.getBadgeObjects(this.callback);
        }.bind(this))
      },
      'without error': function (err, badges) {
        assert.equal(badges.length, 2);
      }
    },
    'Should be able to put badges into collection by object' : {
      topic: function () {
        var collection = createCollection()
        collection.data.badges = [{data:{id:1}}, {data:{id:2}}];
        collection.save(function (err, collection) {
          collection.getBadgeObjects(this.callback);
        }.bind(this))
      },
      'without error': function (err, badges) {
        assert.equal(badges.length, 2);
      }
    }
  }
}).export(module);