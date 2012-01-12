var vows = require('./setup')
  , assert = require('assert')
  , mysql = require('../lib/mysql')
  , User = require('../models/user')

// all queries get queued and executed in series.
mysql.prepareTesting();

vows.describe('user functions').addBatch({
  'making a new user': {
    topic: function () {
      User.newUser({email: 'bimmy@example.com'}, this.callback)
    },
    'makes a new user': function (err, user) {
      // {email: ..., id: ..., active: 0/1, passwd: ..., last_login: ...}
      assert.isObject(user);
      assert.include(user, 'email');
      assert.include(user, 'id');
      assert.include(user, 'active');
      assert.include(user, 'passwd');
      assert.include(user, 'last_login');
      assert.equal(user.email, 'bimmy@example.com');
    },
    
    'and making a new collection': {
      topic: function (user) {
        User.newCollection({user_id: user.id, name: 'wutttt'}, this.callback)
      },
      'makes a new collection': function () {},
      
      'and adding a badge to a collection': {
        topic: function () {},
        'adds a badge to that collections': function () {}
      }
    },
    
    'and making a new collection (2)': {
      topic: function () {},
      'then renaming a collection': {
        topic: function () {},
        'renames that collection': function () {},
        
        'and then deleting a collection': {
          topic: function () {},
          'deletes that collection': function () {}
        }
      }
    },
    
    'making a new collection (3)': {
      'adding a bunch of badges': {
        topic: function () {},
        'adds all those badges': function () {},
        
        'getting all the badges': {
          topic: function () {},
          'gets all those badges': function () {},
          
          'removing a badge': {
            topic: function () {},
            'removes that badge': function () {}
          }
        }
      }
    }
  }
  
}).export(module)
