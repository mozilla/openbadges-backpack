const _ = require('underscore');
const mysql = require('../lib/mysql');
const test = require('tap').test;
const async = require('async');

/**
 * Make a cleanup test that closes the database connection
 *
 */

test.closeDatabase = function closeDatabase () {
  test('closing database', function (t) {
    mysql.client.destroy(); t.end();
  });
};

/**
 * Recreate the test database and optionally insert test data.
 *
 * @asyncronous
 * @return {Object} whatever fixtures were passed into it
 */

test.prepareDatabase = function prepareDatabase(fixtures, callback) {
  if (typeof fixtures === 'function')
    callback = fixtures, fixtures = {};
  callback = callback || function(){};

  const putFixtures = insertFixtures.bind(null, fixtures);

  async.series([
    recreateDatabase,
    putFixtures,
  ], function (err, results) {
    if (err) throw err;
    callback(results[1]);
  });
};

module.exports = test;

function recreateDatabase(callback) {
  async.series([
    mysql.dropTestDatabase,
    mysql.createTestDatabase,
    mysql.useTestDatabase,
    mysql.createTables
  ], function (err, results) {
    if (err) throw err;
    callback(null, results);
  });
}

function keyFromObj(obj) {
  return function (key) { return obj[key] };
}

function sortedValues(obj) {
  return _.keys(obj).sort().map(keyFromObj(obj));
}

function itemSaver(item, callback) {
  console.dir(callback);
  return item.save(callback);
}

function insertFixtures(fixtures, callback) {
  var items = sortedValues(fixtures);
  async.mapSeries(items, itemSaver, function (err, results) {
    if (err) throw err;
    callback(null, fixtures);
  })
}

