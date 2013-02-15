const test = require('tap').test;
const testUtils = require('./');
const conmock = require('./conmock');
const share = require('../controllers/share');

const User = require('../models/user');
const Badge = require('../models/badge');
const Group = require('../models/group');

testUtils.prepareDatabase({
  '1-user': new User({ email: 'brian@example.com' }),
  '2-other-user': new User({ email: 'lolwut@example.com' }),
  '3-badge': new Badge({
    user_id: 1,
    type: 'hosted',
    endpoint: 'endpoint',
    image_path: 'image_path',
    body_hash: 'body_hash',
    body: testUtils.makeAssertion()
  }),
  '4-group': new Group({
    user_id: 1,
    name: 'name',
    url: 'url',
    'public': 0,
    badges: [1]
  }),
}, function (fixtures) {
  test('share#createOrUpdate: no user', function (t) {
    conmock(share.createOrUpdate, function (err, mock) {
      t.same(mock.status, 403, 'should be forbidden');
      t.end();
    });
  });

  test('share#createOrUpdate: wrong user', function (t) {
    const user = fixtures['2-other-user'];
    const group = fixtures['4-group'];
    const request = { user: user, group: group }
    conmock({
      handler: share.createOrUpdate,
      request: request,
    }, function (err, mock) {
      t.same(mock.status, 403, 'should be forbidden');
      t.end();
    });
  });

  testUtils.finish(test);
});


