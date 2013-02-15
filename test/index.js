const _ = require('underscore');
const mysql = require('../lib/mysql');
const migrations = require('../lib/migrations');
const async = require('async');

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';

/**
 * Generate a random string
 *
 * @param {Integer} length
 * @return {String}
 */

exports.randomstring = function randomstring(length) {
  const str = [];
  while (length--)
    str.push(randomchar(ALPHABET))
  return str.join('');
};

/**
 * Make a cleanup test that closes the database connection
 *
 * @param {Object} test
 *   A tap test object
 */

exports.finish = function closeDatabase (test) {
  test('cleaning up', function (t) {
    mysql.client.destroy(); t.end();
  });
};

/**
 * Recreate the test database and optionally insert test data.
 *
 * @asyncronous
 * @return {Object} whatever fixtures were passed into it
 */

exports.prepareDatabase = function prepareDatabase(fixtures, callback) {
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

/**
 * Generate a valid-looking assertion object
 *
 * @param {Object} changes
 *   An object with potential changes. For deep changes, you can use a
 *   dotted path to select, i.e. `badge.version`.
 * @return {Object} assertion object
 */

exports.makeAssertion = function makeAssertion(changes) {
  changes = changes || {};
  var assertion = makeValidAssertion();

  _.keys(changes).forEach(function (k) {
    const fields = k.split('.');
    var current = assertion;
    var previous = null;

    fields.forEach(function (f) {
      previous = current;
      current = current[f];
    });

    previous[fields.pop()] = changes[k];
  });
  return assertion;
}

// private

function makeValidAssertion() {
  return {
    recipient: 'bimmy@example.com',
    evidence: '/bimmy-badge.json',
    expires: '2040-08-13',
    issued_on: '2011-08-23',
    badge: {
      version: 'v0.5.0',
      name: 'Open Source Contributor',
      description: 'For rocking in the free world',
      image: '/badge.png',
      criteria: 'http://example.com/criteria.html',
      issuer: {
        origin: 'http://p2pu.org',
        name: 'p2pu',
        org: 'school of webcraft',
        contact: 'admin@p2pu.org'
      }
    }
  };
}

function recreateDatabase(callback) {
  async.series([
    mysql.dropTestDatabase,
    mysql.createTestDatabase,
    mysql.useTestDatabase,
    migrations.up
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
  return item.save(callback);
}

function insertFixtures(fixtures, callback) {
  var items = sortedValues(fixtures);
  async.mapSeries(items, itemSaver, function (err, results) {
    if (err) throw err;
    callback(null, fixtures);
  })
}

function randomchar(charset) {
  const length = charset.length;
  return charset[Math.random() * length | 0];
}

