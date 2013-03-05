const test = require('tap').test;
const testUtils = require('./');
const conmock = require('./conmock');
const displayer = require('../controllers/displayer');

const User =  require('../models/user');
const Badge = require('../models/badge');
const Group = require('../models/group');

testUtils.prepareDatabase({
  '1-user': new User({
    email: 'brian@example.org'
  }),
  '2-other-user': new User({
    email: 'yo@example.org'
  }),
  '3-badge': new Badge({
    user_id: 1,
    endpoint: 'endpoint',
    image_path: 'image_path',
    body_hash: 'body_hash',
    body: testUtils.makeAssertion({ recipient: 'brian@example.org' })
  }),
  '4-group': new Group({
    user_id: 1,
    name: 'Public Group',
    url: 'Public URL',
    'public': 1,
    badges: [1]
  }),
  '5-private-group': new Group({
    user_id: 1,
    name: 'Private Group',
    url: 'Private URL',
    'public': 0,
    badges: [1]
  }),
}, function (fixtures) {

  test('displayer#emailToUserId', function (t) {
    const user = fixtures['1-user'];
    const handler = displayer.emailToUserId;

    t.plan(3);

    conmock({
      handler: handler,
      request: { body: { email: user.get('email') }}
    }, function (err, mock) {
      t.same(mock.body.userId, user.get('id'), 'should get correct id back');
    });

    conmock({
      handler: handler,
      request: {}
    }, function (err, mock) {
      t.same(mock.status, 400, 'should get 400 if no email passed in');
    });

    conmock({
      handler: handler,
      request: { body: { email: 'missing-email@example.org' }}
    }, function (err, mock) {
      t.same(mock.status, 404, 'should get 404 if email is not in the db');
    });
  });

  test('displayer#userGroups', function (t) {
    const user = fixtures['1-user'];
    const group = fixtures['4-group'];
    const handler = displayer.userGroups;

    conmock({
      handler: handler,
      request: { user: user }
    }, function (err, mock) {
      t.same(mock.status, 200, 'should have 200');
      t.same(mock.body.userId, 1, 'should have the correct user');
      t.same(mock.body.groups.length, 1, 'should have a group');
      const result = mock.body.groups[0];
      t.same(result.groupId, group.get('id'), 'should be the right group');
    });

    // jsonp
    conmock({
      handler: handler,
      request: {
        user: user,
        query: { callback: 'cats' }
      }
    }, function (err, mock) {
      t.ok(mock.body.match(/^cats/), 'should have jsonp callback');
    });

    // unknown format
    conmock({
      handler: handler,
      request: {
        url: '/hi.yolo',
        user: user,
        headers: { 'accept': '*/*' }
      }
    }, function (err, mock) {
      t.same(mock.status, 400);
      t.ok(mock.body.match(/format/i), 'should be a format error');
      t.end();
    });
  });

  test('displayer#userGroupBadges', function (t) {
    const user = fixtures['1-user'];
    const otherUser = fixtures['2-other-user'];
    const badge = fixtures['3-badge'];
    const publicGroup = fixtures['4-group'];
    const privateGroup = fixtures['5-private-group'];
    const handler = displayer.userGroupBadges;
    var request;

    request = { user: user, group: publicGroup };
    conmock({
      handler: handler,
      request: request,
    }, function (err, mock) {
      t.same(mock.body.groupId, publicGroup.get('id'));
      t.same(mock.body.userId, user.get('id'));
      t.same(mock.body.badges.length, 1, 'should have one badge');
      const result = mock.body.badges[0];
      t.same(result.name, badge.get('name'), 'should have the right badge');
    });

    request = { user: user, group: privateGroup };
    conmock({
      handler: handler,
      request: request,
    }, function (err, mock) {
      t.same(mock.status, 404, 'should not find a group when it is private');
    });

    request = { user: otherUser, group: publicGroup };
    conmock({
      handler: handler,
      request: request,
    }, function (err, mock) {
      t.same(mock.status, 404, 'should pretend to be missing when the user does not match');
      t.end();
    });
  });

  testUtils.finish(test);
});
