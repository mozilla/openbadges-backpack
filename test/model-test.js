var vows = require('./setup').vows
  , assert = require('assert')
  , fixture = require('./utils').fixture
  , UserBadge = require('../model').UserBadge

vows.describe('Badge model').addBatch({
  'An empty badge': {
    topic: function(){
      (new UserBadge()).save(this.callback);
    },
    'cannot be saved': function(err, badge) {
      assert.equal(badge, null);
    },
    'has a bunch of errors': function(err, badge){
      assert.ok(Object.keys(err).length > 0);
      assert.equal(err['recipient'], 'missing');
      assert.equal(err['badge.name'], 'missing');
    }
  },
  'A nearly-complete badge': {
    topic: new UserBadge(fixture()),
    'has data where the data should be': function(err, badge) {
      assert.greater(Object.keys(badge.data).length, 0);
    },
    'has empty meta': function(badge) {
      assert.equal(Object.keys(badge.meta).length, 0);
    },
    'has just one error': function(badge) {
      var errors = badge.errors();
      assert.equal(Object.keys(errors).length, 1);
      assert.equal(errors['meta.pingback'], 'missing');
    }
  },
  'A totally-complete': {
    topic: function() {
      var badge = new UserBadge(fixture());
      badge.meta.pingback = 'http://google.com/';
      badge.save(this.callback);
    },
    'can be saved': function(err, badge) {
      assert.equal(err, null);
      assert.ok(badge);
      assert.ok(badge.id);
    },
    'can be retrieved by `{id:...}`': {
      topic: function(badge) {
        badge.save();
        if (!badge.id) throw 'badge should have id'
        UserBadge.find({id: String(badge.id)}, this.callback);
      },
      'from the database': function(err, badges){
        assert.equal(badges.length, 1);
        assert.equal(badges.pop().data.recipient, 'bimmy@example.com');
      }
    },
    'can be retrieved by `id`': {
      topic: function(badge) {
        badge.save();
        if (!badge.id) throw 'badge should have id'
        UserBadge.find(String(badge.id), this.callback);
      },
      'from the database': function(err, badges){
        assert.equal(badges.length, 1);
        assert.equal(badges.pop().data.recipient, 'bimmy@example.com');
      }
    },
    'can be retrieved by `{recipient: ...}"`': {
      topic: function(badge) {
        badge.save();
        if (!badge.id) throw 'badge should have id'
        UserBadge.find({recipient: 'bimmy@example.com'}, this.callback);
      },
      'from the database': function(err, badges){
        assert.equal(badges.length, 1);
        assert.equal(badges.pop().data.recipient, 'bimmy@example.com');
      }
    },
    'can be retrieved by `{"badge.issuer.name": ...}"`': {
      topic: function(badge) {
        badge.save();
        if (!badge.id) throw 'badge should have id'
        UserBadge.find({recipient: 'bimmy@example.com', 'badge.issuer.name': 'p2pu'}, this.callback);
      },
      'from the database': function(err, badges){
        assert.equal(badges.length, 1);
        assert.equal(badges.pop().data.recipient, 'bimmy@example.com');
      }
    },
  }
}).export(module);
