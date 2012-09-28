var vows = require('vows')
  , mysql = require('../lib/mysql')
  , Portfolio = require('../models/portfolio')
  , should = require('should')

var UNICODE_TITLE = "てすと";

var createDbFixtures = function (callback) {
  var addUser = "INSERT INTO `user` (email) VALUES ('brian@example.com')";
  var addBadge = "INSERT INTO `badge`"
    + "(user_id, type, endpoint, image_path, body, body_hash)"
    + "VALUES"
    + "(1, 'hosted', 'http://example.com', '/dev/null', '{\"wut\":\"lol\"}', 'sha256$lol')";
  var addGroup = "INSERT INTO `group`"
    + "(user_id, name, badges)"
    + "VALUES"
    + "(1, 'group 1', '{}')";
  mysql.client.query(addUser);
  mysql.client.query(addBadge);
  mysql.client.query(addGroup, callback);
};

vows.describe('Portfolio model').addBatch({
  'A portfolio': {
    topic: function () {
      var callback = this.callback;
      mysql.prepareTesting(function() {
        createDbFixtures(callback);
      });      
    },
    'with unicode characters in its title': {
      topic: function () {
        return new Portfolio({
          group_id: 1,
          title: UNICODE_TITLE,
          stories:{}
        });
      },
      'when saved': {
        topic: function(portfolio) {
          portfolio.save(this.callback);
        },
        'and restored': {
          topic: function(portfolio) {
            Portfolio.findOne({group_id: portfolio.get('group_id')}, this.callback);
          },
          'should not garble the title': function(portfolio) {
            portfolio.get('title').should.equal(UNICODE_TITLE);
          }
        }
      }
    }
  }
}).export(module);

