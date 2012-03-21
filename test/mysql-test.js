var vows = require('vows')
  , assert = require('assert')
  , mysql = require('../lib/mysql')
  , client = mysql.client
  , conf = require('../lib/configuration').get('database')
  , testDb = 'test_' + conf.database; 

Object.values = function (obj) { return Object.keys(obj).map(function (k) { return obj[k]; }) };
var extractFirstValues = function (arr) { return arr.map(function (a) { return Object.values(a).pop(); }) }
var toObj = function (arr) { var r = {}; arr.forEach(function (a) { r[a] = 1; }); return r; }

mysql.prepareTesting();
vows.describe('Testing database').addBatch({
  "After running test prep": {
    topic: function () {
      client.query('show databases', this.callback);
    },
    'proper database is created': function (err, results) {
      var databases = extractFirstValues(results);
      assert.includes(databases, testDb);
    },
    'expected tables': {
      topic: function () {
        client.query('show tables', this.callback);
      },
      'are created': function (err, results) {
        var tables = extractFirstValues(results);
        assert.equal(mysql.schemas.length, tables.length);
        // #TODO: should not hardcode these.
        ['badge', 'user', 'group' ].forEach(function (t) {
          assert.includes(tables, t);
        })
      }
    }
  }
}).export(module);
