var vows = require('./setup').vows
  , assert = require('assert')
  , db = require('../database')
 
var documents = [{'what': 'lol'}, {'hey':'jude'}];
db.collection('badges').insert(documents, function(err, docs) {
  console.dir(docs);
})
 
 
vows.describe('Database storage & retrieval').addBatch({
  'A db interface': {
    topic: db.collection('badges'),
    'when inserting a document' : {
      topic: function(collection) {
        collection.insert({test: 'sup'}, this.callback);
      },
      'returns its structure': function(err, result){
        assert.ok(!err);
        assert.equal(result[0].test, 'sup');
        assert.ok(result[0]['_id']);
        console.dir(result[0]['_id']);
      },
      'read': function(){  },
      'update': function(){  },
      'destroy': function(){  }
    },
    teardown: function(){ db.connection.close(); }
  }
}).export(module)


