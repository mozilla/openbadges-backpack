const _ = require('underscore');
const test = require('tap').test;
const testUtils = require('./');

const Badge = require('../models/badge');
const User = require('../models/user');
const Group = require('../models/group');

testUtils.prepareDatabase({
  '1-user': new User({
    email: 'brian@example.org'
  }),
  '2-user': new User({
    email: 'brian2@example.org'
  }),
  '3-badge': new Badge({
    user_id: 1,
    endpoint: 'endpoint',
    image_path: 'image_path',
    body: testUtils.makeAssertion({'badge.name': 'Badge One'})
  }),
  '4-badge': new Badge({
    user_id: 1,
    endpoint: 'endpoint',
    image_path: 'image_path',
    body: testUtils.makeAssertion({'badge.name': 'Badge Two'})
  }),
  '5-group': new Group({
    user_id: 1,
    name: 'Test Group',
    badges: [1, 2]
  })
}, function (fixtures) {
  test('Group#save: default a new url', function (t) {
    const group = new Group({
      user_id: 1,
      name: 'New Group',
      badges: [1, 2]
    });
    group.save(function (err, result) {
      t.notOk(err, 'should not have an error');
      t.ok(group.get('id'), 'should have an id');
      t.ok(group.get('url'), 'should have a url now');
      t.end();
    });
  });

  test('Group#save: new name, same url', function (t) {
    const group = fixtures['5-group'];
    const expect = group.get('url');
    group.set('name', 'Awesome Group');
    group.save(function (err, result) {
      t.same(group.get('url'), expect, 'should have same url');
      t.end();
    })
  });

  test('Group#getBadgeObjects', function (t) {
    const group = fixtures['5-group'];
    const expect = fixtures['3-badge'];

    group.set('badges', [1, 2]);

    group.getBadgeObjects(function (err, badges) {
      t.notOk(err, 'should not have an error');
      const badge = badges[0];
      t.same(badge.get('id'), expect.get('id'), 'should get right badge back');
      t.end();
    })
  });

  test('Group#save: badges by object', function (t) {
    const badges = [fixtures['3-badge'], fixtures['4-badge']];
    const group = new Group({
      user_id: 1,
      name: 'New Group Alpha',
      badges: badges
    });
    t.same(group.get('badges'), [1, 2]);
    group.save(function (err) {
      t.notOk(err, 'no errors');
      t.same(group.get('badges'), [1, 2]);
      t.end();
    })
  });

  testUtils.finish(test);
});
