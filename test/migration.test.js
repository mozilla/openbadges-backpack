var async = require('async');
var test = require('tap').test;
var constants = require('mysql');
var mysql = require('../lib/mysql');

function getMigrations(callback) {
  mysql.client.query("SELECT * FROM migrations", callback);
}

test("initial migration can be applied and rolled back", function(t) {
  var INITIAL = "20130212162601-initial";

  var migrate = function(callback) {
    mysql.migrations.up({destination: INITIAL}, function(err) {
      if (err) throw err;
      getMigrations(function(err, results) {
        if (err) throw err;
        t.equal(results.length, 1, "one migration occurred");
        t.same(results[0].name, INITIAL, "migration name is initial");
        mysql.client.query("SELECT * FROM user", function(err, results) {
          if (err) throw err;
          t.equal(results.length, 0, "user table exists and has no entries");
          callback(null);
        });
      });
    });
  };
  
  var rollback = function(callback) {
    mysql.migrations.down({count: 1}, function(err) {
      getMigrations(function(err, results) {
        if (err) throw err;
        t.equal(results.length, 0, "migration was rolled back");
        mysql.client.query("SELECT * FROM user", function(err) {
          t.equal(err.number, constants.ERROR_NO_SUCH_TABLE,
                  "user table no longer exists");
          callback(null);
        });
      });
    });
  };
  
  async.series([
    mysql.dropTestDatabase,
    mysql.createTestDatabase,
    mysql.useTestDatabase,
    migrate,
    rollback
  ], function (err) {
    if (err) throw err;
    mysql.client.destroy();
    t.end();
  });
});
