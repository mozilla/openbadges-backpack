const test = require('tap').test;
const testUtils = require('./');
const User = require('../models/user');

const EMAILS = {
  good: ['brian@awesome.com', 'yo+wut@example.com', /*'elniño@español.es',*/ 'ümlaut@heavymetal.de'],
  bad: ['lkajd', 'skj@asdk', '@.com', '909090', '____!@']
};

testUtils.prepareDatabase(function () {
  test('User#save', function (t) {
    const email = 'brian@example.org';
    const user = new User({email: email});
    user.save(function (err) {
      t.notOk(err, 'should not have an error');
      t.same(user.get('id'), 1);
      t.same(user.get('email'), email);
      t.end();
    })
  });

  test('User#validate', function (t) {
    EMAILS.good.forEach(function (email) {
      const err = new User({ email: email }).validate();
      t.notOk(err, 'should not have an error');
    })
    EMAILS.bad.forEach(function (email) {
      const err = new User({ email: email }).validate();
      t.ok(err, 'should have an error');
    })
    t.end();
  });

  test('User#setLoginDate', function (t) {
    const user = new User({ email: 'brian@example.org' });
    t.notOk(user.get('last_login'), 'should not have a last login');
    user.setLoginDate();
    t.ok(user.get('last_login'), 'has a login date');
    t.end();
  });

  test('User.findOrCreate', function (t) {
    const email = 'bad-dudes@example.org';
    User.findOrCreate(email, function (err, user) {
      const id = user.get('id');
      t.notOk(err, 'should not have an error');
      t.ok(id, 'should have an id');
      User.findOrCreate(email, function (err, user) {
        t.notOk(err, 'should not have an error');
        t.same(user.get('id'), id, 'should have gotten the user');
        t.end();
      })
    });
  });

  test('User.totalCount', function(t) {
    User.totalCount(function(err, totalcount) {
      t.notOk(err, "there's users, let's not have errors");
      t.equal(totalcount, 2, 'we have one user, correct');
      t.end();
    })
  })


  testUtils.finish(test);
});


