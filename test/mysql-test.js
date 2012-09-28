var vows = require('vows')
  , assert = require('assert')
  , mysql = require('../lib/mysql')
  , client = mysql.client
  , conf = require('../lib/configuration').get('database')
  , testDb = 'test_' + conf.database; 

Object.values = function (obj) { return Object.keys(obj).map(function (k) { return obj[k]; }) };
var extractFirstValues = function (arr) { return arr.map(function (a) { return Object.values(a).pop(); }) }
var toObj = function (arr) { var r = {}; arr.forEach(function (a) { r[a] = 1; }); return r; }

vows.describe('Testing database').addBatch({
  "After running test prep": {
    topic: function() {
      mysql.prepareTesting(this.callback);
    },
    'complete': function(err, results) {
    },
    'proper database': {
      topic: function () {
        client.query('show databases', this.callback);
      },
      'is created': function (err, results) {
        var databases = extractFirstValues(results);
        assert.includes(databases, testDb);
      }
    },
    'database encoding': {
      topic: function () {
        client.query("show variables like 'character_set_database'", this.callback);
      },
      'is utf8': function (err, results) {
        // #TODO: maybe shouldn't hardcode the encoding? (defined in puppet manifests)
        assert.equal(results[0].Value, 'utf8');
      }
    },
    'expected tables': {
      topic: function () {
        client.query('show tables', this.callback);
      },
      'are created': function (err, results) {
        var tables = extractFirstValues(results);
        // #TODO: should not hardcode these.
        ['badge', 'user', 'group', 'portfolio'].forEach(function (t) {
          assert.includes(tables, t);
        })
      }
    }
  }
}).export(module);
