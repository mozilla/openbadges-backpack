var async = require('async');
var test = require('tap').test;
var $ = require('./');
var _ = require('underscore');
var constants = require('mysql');
var mysql = require('../lib/mysql');
var migrations = require('../lib/migrations');
var migrationDirFiles = require('fs').readdirSync(migrations.dir).sort();
var validator = require('openbadges-validator');
var normalizeAssertion = require('../lib/normalize-assertion');

function up(options) {
  return function(callback) { migrations.up(options, callback); };
}

function down(options) {
  return function(callback) { migrations.down(options, callback); };
}

function sqlError(sql, t, error) {
  return function(callback) {
    mysql.client.query(sql, function(err, results) {
      if (!err)
        throw new Error("expected " + sql + " to throw error");
      t.equal(err.number, constants[error],
              "'" + sql + "' should result in " + error + " (" +
              constants[error] + ")");
      callback(null);
    });
  };
}

function sql(sql, testFunc) {
  return function(callback) {
    mysql.client.query(sql, function(err, results) {
      if (err) throw err;
      if (testFunc)
        testFunc(results);
      callback(null);
    });
  };
}

function findMigration(name) {
  var filename, candidate;
  var previous = null;

  for (var i = 0; i < migrationDirFiles.length; i++) {
    filename = migrationDirFiles[i];
    match = filename.match(/^([0-9]+)-(.*)\.js$/);
    if (match) {
      candidate = match[1] + '-' + match[2];
      if (match[2] == name)
        return {previous: previous, id: candidate};
      previous = candidate;
    }
  }
  throw new Error("migration not found: " + name);
}

function testMigration(name, getSeries) {
  var migration = findMigration(name);
  var series = [
    mysql.dropTestDatabase,
    mysql.createTestDatabase,
    mysql.useTestDatabase
  ];

  if (!migration.previous)
    migration.previous = "empty database";

  test("migration from " + migration.previous + " to " +
       migration.id + " and back works", function(t) {
    series = series.concat(getSeries(t, migration.id, migration.previous));
    async.series(series, function(err) {
      if (err) throw err;
      mysql.client.destroy();
      t.end();
    });
  });
}

testMigration("initial", function(t, id) {
  return [
    up({destination: id}),
    sql("SELECT * FROM migrations", function(results) {
      t.equal(results.length, 1, "one migration occurred");
      t.same(results[0].name, id, "migration name is " + id);
    }),
    sql("SELECT * FROM user", function(results) {
      t.equal(results.length, 0, "user table exists and has no entries");
    }),
    down({count: 1}),
    sql("SELECT * FROM migrations", function(results) {
      t.equal(results.length, 0, id + " was rolled back");
    }),
    sqlError("SELECT * FROM user", t, "ERROR_NO_SUCH_TABLE")
  ];
});

testMigration("add-public-columns", function(t, id, previousId) {
  return [
    up({destination: previousId}),
    sql("INSERT INTO `user` (id, email) VALUES (1,'foo@bar.org');"),
    sql("INSERT INTO `badge` VALUES (1,1,'hosted','http://foo',NULL,NULL," +
        "'/blah.png',0,'i am a json assertion','i am a json assertion hash'" +
        ",now());"),
    up({count: 1}),
    sql("SELECT public, public_path FROM badge " +
        "WHERE endpoint='http://foo'", function(results) {
      t.equal(results[0].public, 0, "'public' defaults to false");
      t.equal(results[0].public_path, null, "'public_path' defaults to null");
    }),
    down({count: 1}),
    sqlError("SELECT public_path FROM badge", t, "ERROR_BAD_FIELD_ERROR"),
    sqlError("SELECT public FROM badge", t, "ERROR_BAD_FIELD_ERROR")
  ];
});

testMigration("drop-public-key-field", function(t, id, previousId) {
  return [
    up({destination: previousId}),
    sql("INSERT INTO `user` (id, email) VALUES (1,'foo@bar.org');"),
    sql("INSERT INTO `badge` (id, user_id, type, image_path, body, body_hash) VALUES (1,1,'hosted','image.png','body','hash')"),
    up({count: 1}),
    sqlError("SELECT public_key FROM badge", t, "ERROR_BAD_FIELD_ERROR"),
  ];
});

testMigration("rename-jwt-to-signature", function(t, id, previousId) {
  return [
    up({destination: previousId}),
    sql("INSERT INTO `user` (id, email) VALUES (1,'foo@bar.org');"),
    sql("INSERT INTO `badge` (id, user_id, type, jwt, image_path, body, body_hash) VALUES (1,1,'hosted', 'sup', 'image.png','body','hash')"),
    up({count: 1}),
    sql("SELECT signature FROM badge WHERE id=1", function(results) {
      t.equal(results[0].signature, 'sup', "'jwt' should have been renamed");
    }),
    down({count: 1}),
    sql("SELECT jwt FROM badge WHERE id=1", function(results) {
      t.equal(results[0].jwt, 'sup', "'jwt' should have risen from the grave like a phoenix");
    }),
  ];
});

testMigration("drop-badge-type-column", function(t, id, previousId) {
  return [
    up({destination: previousId}),
    sql("INSERT INTO `user` (id, email) VALUES (1,'foo@bar.org');"),
    sql("INSERT INTO `badge` (id, user_id, type, signature, image_path, body, body_hash) VALUES (1,1,'hosted', 'sup', 'image.png','body','hash')"),
    up({count: 1}),
    sqlError("SELECT `type` FROM badge", t, "ERROR_BAD_FIELD_ERROR"),
  ];
});

testMigration("drop-rejected-column-from-badge", function(t, id, previousId) {
  return [
    up({destination: previousId}),
    sql("INSERT INTO `user` (id, email) VALUES (1,'foo@bar.org');"),
    sql("INSERT INTO `badge` (id, user_id, image_path, body, body_hash) VALUES (1,1, 'image.png','body','hash')"),
    up({count: 1}),
    sqlError("SELECT `rejected` FROM badge", t, "ERROR_BAD_FIELD_ERROR"),
  ];
});

testMigration("add-image-data-column", function(t, id, previousId) {
  const fs = require('fs');
  const conf = require('../lib/configuration')
  const image1 = fs.readFileSync(__dirname + '/data/static/_badges/image1.png');
  const image2 = fs.readFileSync(__dirname + '/data/static/_badges/image2.png');
  conf.set('badge_path', __dirname + '/data/static/_badges');

  return [
    up({destination: previousId}),
    sql("INSERT INTO `user` (id, email) VALUES (1,'foo@bar.org');"),
    sql("INSERT INTO `badge` (id, user_id, image_path, body, body_hash) VALUES (1,1, '/_badges/image1.png','body','hsh1')"),
    sql("INSERT INTO `badge` (id, user_id, image_path, body, body_hash) VALUES (2,1, '/_badges/image2.png','body','hsh2')"),
    up({count: 1}),
    sql("SELECT image_data FROM badge ORDER BY `id` ASC", function(results) {
      t.same(Buffer(results[0].image_data, 'base64'), image1);
      t.same(Buffer(results[1].image_data, 'base64'), image2);
    }),
    down({count: 1}),
    sqlError("SELECT image_data FROM badge", t, "ERROR_BAD_FIELD_ERROR"),
  ];
});

testMigration("move-image-data", function(t, id, previousId) {
  return [
    up({destination: previousId}),
    sql("INSERT INTO `user` (id, email) VALUES (1,'foo@bar.org');"),
    sql("INSERT INTO `badge` (id, user_id, image_path, body, body_hash, image_data) VALUES (1,1, '/_badges/image1.png','body','hsh1', 'image1')"),
    sql("INSERT INTO `badge` (id, user_id, image_path, body, body_hash, image_data) VALUES (2,1, '/_badges/image2.png','body','hsh2', 'image2')"),
    up({count: 1}),
    sql("SELECT image_data, badge_hash FROM badge_image ORDER BY `id` ASC", function(results) {
      t.same(results[0], {image_data: 'image1', badge_hash: 'hsh1'});
      t.same(results[1], {image_data: 'image2', badge_hash: 'hsh2'});
    }),
    sqlError("SELECT image_data FROM badge", t, "ERROR_BAD_FIELD_ERROR"),
    down({count: 1}),
    sql("SELECT id, image_data FROM badge ORDER BY `id` ASC", function(results) {
      t.same(results[0], {image_data: 'image1', id: 1});
      t.same(results[1], {image_data: 'image2', id: 2});
    })
  ];

});

testMigration("remove-non-normalized-badge-uploads", function(t, id, previousId) {
  var newAssertion = $.makeNewAssertion();
  var mockHttp = $.mockHttp()
    .get('/assertion').reply(200, JSON.stringify(newAssertion), { 'content-type': 'application/json' })
    .get('/assertion').reply(200, JSON.stringify(newAssertion), { 'content-type': 'application/json' })
    .get('/assertion-image').reply(200, 'image', { 'content-type': 'image/png' })
    .get('/badge-image').reply(200, 'image', { 'content-type': 'image/png' })
    .get('/badge').reply(200, JSON.stringify($.makeBadgeClass()))
    .get('/issuer').reply(200, JSON.stringify($.makeIssuer()));

  return [
    up({destination: previousId}),
    sql("INSERT INTO `user` (id, email) VALUES (1,'foo@bar.org');"),
    function insertOldAssertionData(callback) {
      var oldAssertion = $.makeAssertion();
      validator(oldAssertion, function(err, info) {
        if (err) callback(err);
        var oldBody = normalizeAssertion(info);
        var sql = "INSERT INTO `badge` (id, user_id, image_path, body, body_hash)" +
                  "VALUES (3, 1, 'image.png', '" + JSON.stringify(oldBody) + "', 'hash3')";
        mysql.client.query(sql, callback);
      });
    },
    function insertNewAssertionData(callback) {
      validator(newAssertion, function(err, info) {
        if (err) callback(err);
        var badBody = info.structures.assertion;
        var newBody = normalizeAssertion(info);
        async.series(
          [
            sql("INSERT INTO `badge` (id, user_id, image_path, body, body_hash)" +
                "VALUES (1, 1, 'image.png', '" + JSON.stringify(badBody) + "', 'hash1')"),
            sql("INSERT INTO `badge` (id, user_id, image_path, body, body_hash)" +
                "VALUES (2, 1, 'image.png', '" + JSON.stringify(newBody) + "', 'hash2')")
          ],
          function(err) {
            callback(err);
          }
        );
      });
    },
    up({count: 1}),
    sql("SELECT id, body FROM badge ORDER BY id ASC", function(results) {
      var ids = results.map(function(result){ return result.id; });
      t.same(ids, ['2', '3'], 'bad badge deleted, good badges kept');
    })
  ];
});