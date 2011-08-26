var vows = require('./setup').vows
  , assert = require('assert')
  , db = require('../database')

vows.describe('Database storage & retrieval').addBatch({
  'A db interface': {
    topic: db.collection('badges'),
    'when inserting a document' : {
      topic: function(collection) {
        collection.insert({test: 'sup'}, this.callback);
      },
      'returns its structure': function(err, result){
        var doc = result[0];
        assert.ok(!err);
        assert.equal(doc.test, 'sup');
        assert.ok(doc['_id']);
      },
      'read': function(){  },
      'update': function(){  },
      'destroy': function(){  }
    },
    teardown: function(){ db.connection.close(); }
  }
}).export(module)
