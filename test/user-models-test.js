var vows = require('./setup')
  , assert = require('assert')
  , mysql = require('../lib/mysql')
  , User = require('../models/user')

// all queries get queued and executed in series.
mysql.prepareTesting();

vows.describe('user model').addBatch({
  'When saving a new user': {
    topic: function () {
      var bimmy = new User({email: 'bimmy@example.com'})
      bimmy.save(this.callback);
    },
    'no errors are thrown': function (err, user) { assert.ifError(err) },
    'the user object': {
      topic: function (user) { return user },
      'is returned': function (user) { assert.ok(user) },
      'contains id': function (user) { assert.ok(user.data.id) },
      'contains email': function (user) { assert.equal(user.data.email, 'bimmy@example.com') },
      'can be updated': {
        topic: function (user) {
          user.data.active = 0;
          user.save(this.callback);
        },
        'without error': function (err, user) { assert.ifError(err) },
        'and return the right data': function (err, user) { assert.equal(user.data.active, 0) }
      },
      'contains an id, that when searched for': {
        topic: function(user) { User.findById(user.data.id, this.callback) },
        'returns the very same user object': function (err, result) {
          assert.equal(result.data.email, 'bimmy@example.com');
        }
      }
    }
  }
}).export(module)
