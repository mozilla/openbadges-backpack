var vows = require('./setup').vows
  , assert = require('assert')
  , db = require('../database')

// operations on the database will happen in order.
var collection = db.collection('db_test');

// clean slate before we begin
collection.remove({})
collection.insert([
  {name: 'brian'},
  {name: 'jeremy'},
  {name: 'miko'},
  {name: 'alex'},
  {recipient: 'bimmy@example.com',
   evidence: '/bimmy-badge.json',
   expires: '2040-08-13',
   issued_on: '2011-08-23',
   badge: {
     version: 'v0.5.0',
     name: 'HTML5',
     description: 'For rocking in the free world',
     image: '/html5.png',
     criteria: 'http://example.com/criteria.html',
     issuer: {
       name: 'p2pu',
       org: 'school of webcraft',
       contact: 'admin@p2pu.org',
       url: 'http://p2pu.org/schools/sow'
     }
   }
  }
])

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
        var query = {recipient: 'bimmy@example.com', 'badge.issuer.name': 'p2pu', 'badge.issuer.org': 'school of webcraft'}
        collection.find(query, this.callback);
      },
      'gets the document': function(err, docs){
        assert.equal(docs.length, 1);
      }
    },
    'when updating a doc': {
      topic: function(collection){
        collection.update({name: 'miko'}, {'$set': {name: 'ian'}}, function(err) {if (err) throw err;});
        collection.find({name: 'ian'}, this.callback);
      },
      'the doc should change': function(err, docs) {
        assert.equal(docs.length, 1);
        assert.equal(docs[0].name, 'ian');
      }
    },
    'when removing a doc': {
      topic: function(collection) {
        collection.remove({name: 'alex'}, function(err){if (err) throw err;})
        collection.find({name: 'alex'}, this.callback)
      },
      'the doc be removed': function(err, docs) {
        assert.equal(docs.length, 0);
      }
    },
    'when upserting': {
      topic: function(collection){
        var selector = {plural: {crow: 'murder'}};
        var newDoc = {plural: {crow: 'murder'}, is_this_awesome: 'totally'};
        collection.upsert(selector, newDoc, function(err) {
          if (err) throw err;
          newDoc.is_this_awesome = 'yep';
        });
        collection.upsert(selector, newDoc, function(err) {if (err) throw err;});
        collection.find(selector, this.callback)
      },
      'there should only be one': function(err, docs) {
        assert.equal(docs.length, 1);
      },
      'the value should be from the second upsert': function(err, docs) {
        assert.equal(docs[0].is_this_awesome, 'yep');
      }
    }
  }
}).export(module)
