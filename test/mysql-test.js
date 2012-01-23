var vows = require('vows')
  , assert = require('assert')
  , mysql = require('../lib/mysql')
  , client = mysql.client;

vows.describe('Testing database').addBatch({
  "taaaaaaables": {
    topic: function () { client.query('show databases', this.callback) },
    'can be whaaaat': function (err, data) {
      console.dir(data);
      assert.ok(true);
    } 
  }
}).export(module);

