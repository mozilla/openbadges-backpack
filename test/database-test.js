var vows = require('./setup').vows
  , assert = require('assert')
  , db = require('../database')

var collection = db.collection('db_test');

// clean slate before we begin
// #TODO: make sure this is a the test environment
collection.remove({}) 

// poor man's fixture
collection.insert([
  {name: 'brian'},
  {name: 'jeremy'},
  {name: 'miko'},
  {name: 'alex'},
  {complicated:{document: {may: {cause: 'issues'}},other: {fields: {distraction: true}}}}
], function(err, docs){
  
  vows.describe('Database storage & retrieval').addBatch({
    'A db interface': {
      topic: collection,
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
      },
      
      'when finding documents': {
        topic: function(collection){
          collection.find({name: {'$exists': true} }, this.callback);
        },
        'gets the docs': function(err, docs){
          assert.ok(docs.length >= 3);
        }
      },
      'when finding a specific document': {
        topic: function(collection){
          collection.find({name: 'brian'}, this.callback);
        },
        'gets the document': function(err, docs){
          assert.equal(docs.length, 1);
          assert.equal(docs[0].name, 'brian');
        }
      },
      'when finding a complicated document': {
        topic: function(collection){
          collection.find({'complicated.document.may.cause': 'issues' }, this.callback);
        },
        'gets the document': function(err, docs){
          assert.equal(docs.length, 1);
        }
      },
      'when updating a doc': {
        topic: function(collection){
          var self = this;
          collection.update({name: 'miko'}, {'$set': {name: 'ian'}}, function(err) {
            if (err) throw err;
            collection.find({name: 'ian'}, self.callback);
          });
        },
        'the doc should change': function(err, docs) {
          assert.equal(docs.length, 1);
          assert.equal(docs[0].name, 'ian');
        }
      },
      'when removing a doc': {
        topic: function(collection) {
          var self = this;
          collection.remove({name: 'alex'}, function(err){
            if (err) throw err;
            collection.find({name: 'alex'}, self.callback)
          })
        },
        'the doc should not be found': function(err, docs) {
          assert.equal(docs.length, 0);
        }
      },
      teardown: function(){ db.connection.close(); }
    }
  }).export(module)
})
