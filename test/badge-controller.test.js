const _ = require('underscore');
const test = require('tap').test;
const testUtils = require('./');
const badge = require('../controllers/badge');
const conmock = require('./conmock');

const User = require('../models/user');
const Badge = require('../models/badge');

function makeHash (email, salt) {
  const sha = require('crypto').createHash('sha256');
  return 'sha256$' + sha.update(email + salt).digest('hex');
}

testUtils.prepareDatabase({
  '1-real-user': new User({ email: 'brian@example.org' }),
  '2-false-user': new User({ email: 'thief@example.org' }),
  '3-badge-raw': new Badge({
    user_id: 1,
    type: 'hosted',
    endpoint: 'endpoint',
    image_path: 'image_path',
    body_hash: 'body_hash',
    body: testUtils.makeAssertion({
      recipient: 'brian@example.org',
      criteria: '/ohsup.html'
    })
  }),
  '4-badge-hashed': new Badge({
    user_id: 1,
    type: 'hosted',
    endpoint: 'endpoint',
    image_path: 'image_path',
    body_hash: 'body_hash',
    body: testUtils.makeAssertion({
      recipient: makeHash('brian@example.org', 'hashbrowns'),
      salt: 'hashbrowns'
    })
  })
}, function (fixtures) {

  test('badge#destroy', function (t) {
    const owner = fixtures['1-real-user'];
    const thief = fixtures['2-false-user'];
    const badgeRaw = fixtures['3-badge-raw'];
    const badgeHashed = fixtures['4-badge-hashed'];
    const handler = badge.destroy;

    conmock({
      handler: handler,
      request: { badge: badgeRaw }
    }, function (err, mock) {
      t.same(mock.status, 403, 'cannot delete a badge without a user');
    });

    conmock({
      handler: handler,
      request: { user: owner }
    }, function (err, mock) {
      t.same(mock.status, 404, 'should 404 without a badge');
    });

    conmock({
      handler: handler,
      request: { badge: badgeRaw, user: thief }
    }, function (err, mock) {
      t.same(mock.status, 403, 'cannot delete a badge you do not own');
    });

    conmock({
      handler: handler,
      request: { user: owner, badge: badgeRaw }
    }, function (err, mock) {
      t.same(mock.status, 200, 'should delete badge with unhashed email');
    })

    conmock({
      handler: handler,
      request: { user: owner, badge: badgeHashed }
    }, function (err, mock) {
      t.same(mock.status, 200, 'should delete badge with hashed email');
      t.end();
    })
  });

  testUtils.finish(test);
});

