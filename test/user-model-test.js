var vows = require('vows')
  , assert = require('assert')
  , mysql = require('../lib/mysql')
  , User = require('../models/user');

var EMAILS = {
  good: ['brian@awesome.com', 'yo+wut@example.com', /*'elniño@español.es',*/ 'ümlaut@heavymetal.de'],
  bad: ['lkajd', 'skj@asdk', '@.com', '909090', '____!@']
};

var createUser = function (email) {
  return new User({
    email: (email || 'brian@example.com'),
    passwd: 'secret'
  });
};
var makeInvalidEmailTests = function (badData) {
  var tests = {};
  badData.forEach(function (badValue) {
    var test = tests['like "' + badValue + '"'] = {}
    test['topic'] = function () {
      createUser(badValue).save(this.callback);
    };
    test['should fail with error on `email`'] = assertErrors(['email'], 'invalid');
  })
  return tests;
};
var makeValidEmailTests = function (goodData) {
  var tests = {};
  goodData.forEach(function (goodValue) {
    var test = tests['like "' + goodValue + '"'] = {}
    test['topic'] = function () {
      createUser(goodValue).save(this.callback);
    };
    test['should succeed'] = function (err, user) { assert.ifError(err); };
  })
  return tests;
};
var assertErrors = function (fields, msgContains) {
  return function (err, res) {
    if (res instanceof Error) {
      err = res;
      res = null;
    }
    assert.isNull(res);
    assert.instanceOf(err, Error);
    assert.isObject(err.fields);
    fields.forEach(function (f) {
      assert.includes(err.fields, f);
      assert.match(err.fields[f], RegExp(f));
      if (msgContains) {
        assert.match(err.fields[f], RegExp(msgContains));
      }
    })
  }
};

vows.describe('Useeeerrrrrs').addBatch({
  'User testing:': {
    topic: function () {
      mysql.prepareTesting();
      return true;
    },
    'A valid user': {
      'can be saved' : {
        topic: function () {
          var user = createUser();
          user.save(this.callback);
        },
        'and an id is given back': function (err, user) {
          assert.ifError(err);
          assert.isNumber(user.data.id);
        },
        'and retrieved': {
          topic: function (user) {
            User.findById(user.data.id, this.callback);
          },
          'without getting mangled data': function (err, user) {
            assert.equal(user.data.email, 'brian@example.com');
          },
          'with a salt being created': function (err, user) {
            assert.isString(user.data.salt);
            assert.ok(user.data.salt.length > 5);
          },
          'and the password should have been hashed': function (err, user) {
            assert.notEqual(user.data.passwd, 'secret');
          },
          'and the password can be checked accurately': function (err, user) {
            assert.isTrue(user.checkPassword('secret'));
            assert.isFalse(user.checkPassword('not correct'));
          },
          'and the password can be changed': function (err, user) {
            assert.isTrue(user.checkPassword('secret'));
            assert.isFalse(user.checkPassword('not correct'));
          }
        }
      }
    },
    'A user can be logged in': {
      topic: function () {
        var user = createUser('logintest@example.com');
        user.setLoginDate();
        user.save(this.callback);
      },
      'and when retrieved again': {
        topic: function (user) {
          User.findById(user.data.id, this.callback);
        },
        'the login date is something reasonable': function (err, user) {
          assert.isNumber(user.data.last_login);
          assert.greater(user.data.last_login, 0);
        }
      }
    },
    'Trying to save a user': {
      'with bogus `recipient`': makeInvalidEmailTests(EMAILS.bad),
      'with valid `recipient`': makeValidEmailTests(EMAILS.good)
    },
    'A user': {
      topic: createUser(),
      'can change her password': function (user) {
        var newpw = 'whaat';
        user.changePassword(newpw);
        assert.isTrue(user.checkPassword(newpw));
      }
    },
    'User#findOrCreate': {
      topic: function () {
        var email = 'bad-dudes@example.com';
        User.findOrCreate(email, this.callback);
      },
      'should create a user when given an unfound email': function (err, user) {
        assert.ifError(err);
        assert.equal(user.data.email, 'bad-dudes@example.com');
      }
    }
  }
}).export(module);
