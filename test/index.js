const mysql = require('../lib/mysql');
const test = require('tap').test;
const async = require('async');

test.closeDatabase = function closeDatabase () {
  test('closing database', function (t) {
    mysql.client.destroy(); t.end();
  });
};

test.prepareDatabase = function prepareDatabase(callback) {
  callback = callback || function(){}
  async.series([
    mysql.dropTestDatabase,
    mysql.createTestDatabase,
    mysql.useTestDatabase,
    mysql.createTables
  ], function (err, results) {
    if (err) throw err;
    callback(test.closeDatabase);
  });
};

module.exports = test;