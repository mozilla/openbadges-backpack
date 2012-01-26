var vows = require('vows')
  , assert = require('assert')
  , mysql = require('../lib/mysql')
  , User = require('../models/user');

var EMAILS = {
  good: ['brian@awesome.com', 'yo+wut@example.com', /*'elniño@español.es',*/ 'ümlaut@heavymetal.de'],
  bad: ['lkajd', 'skj@asdk', '@.com', '909090', '____!@']
};

mysql.prepareTesting();
vows.describe('Useeeerrrrrs').addBatch({
  'A valid user': {
    topic: function () {
      return new User({
        email: 'brian@example.com',
        passwd: 'secret'
      })
    },
    'can be saved' : {
      topic: function (user) {
        user.save(this.callback);
      },
      'and an id is given back': function (err, user) {
        assert.ifError(err);
        assert.isNumber(user.data.id);
      },
      'and retrieved': {
        topic: function (user) { return user; },
        'without getting mangled data': function (user) {
          assert.equal(user.data.email, 'brian@example.com');
        },
        'with a salt being created': function (user) {
          assert.isString(user.data.salt);
          assert.ok(user.data.salt.length > 5);
        },
        'and the password should have been hashed': function (user) {
          assert.notEqual(user.data.passwd, 'secret');
        },
        'and the password can be checked accurately': function (user) {
          assert.isTrue(user.checkPassword('secret'));
          assert.isFalse(user.checkPassword('not correct'));
        }
      }
    }
  }
}).export(module);
