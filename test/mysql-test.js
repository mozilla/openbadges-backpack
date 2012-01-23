var vows = require('vows')
  , assert = require('assert')
  , mysql = require('../lib/mysql')
  , client = mysql.client
  , conf = require('../lib/configuration').get('database')
  , testDb = conf.database + "_test";

vows.describe('Testing database').addBatch({
  "When running test prep": {
    topic: function () {
      mysql.prepareTesting();
      client.query('show databases', this.callback);
    },
    'can be created': function (err, results) {
      var databases = results.map(function (a) {return a.Database})
        , testDbExists = (databases.indexOf(testDb) != -1);
      assert.ok(testDbExists);
    } 
  }
}).export(module);

