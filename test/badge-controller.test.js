const _ = require('underscore');
const test = require('tap').test;
const testUtils = require('./');
const badge = require('../controllers/badge');
const conmock = require('./conmock');
const User = require('../models/user');
const Badge = require('../models/badge');
const BadgeImage = require('../models/badge-image');
const images = require('./test-images.js');

function makeHash (email, salt) {
  const sha = require('crypto').createHash('sha256');
  return 'sha256$' + sha.update(email + salt).digest('hex');
}

const RAW_ASSERTION = testUtils.makeAssertion({
  recipient: 'brian@example.org',
  criteria: '/ohsup.html'
});

const HASHED_ASSERTION = testUtils.makeAssertion({
  recipient: makeHash('brian@example.org', 'hashbrowns'),
  salt: 'hashbrowns'
});

testUtils.prepareDatabase({
  '1-real-user': new User({ email: 'brian@example.org' }),
  '2-false-user': new User({ email: 'thief@example.org' }),
  '3-badge-raw': new Badge({
    user_id: 1,
    endpoint: 'endpoint',
    image_path: 'image_path',
    body: RAW_ASSERTION
  }),
  '4-badge-raw-image': new BadgeImage({
    badge_hash: Badge.createHash(RAW_ASSERTION),
    image_data: images.unbaked.toString('base64'),
  }),
  '5-badge-hashed': new Badge({
    user_id: 1,
    endpoint: 'endpoint',
    image_path: 'image_path',
    public_path: '4-badge-hashed-pth',
    body: HASHED_ASSERTION
  }),
  '6-badge-hashed-image': new BadgeImage({
    badge_hash: Badge.createHash(HASHED_ASSERTION),
    image_data: images.unbaked.toString('base64'),
  }),
}, function (fixtures) {
  test('badge#findByUrl sets req.badge when url is valid', function(t) {
    conmock({
      handler: badge.findByUrl,
      param: '4-badge-hashed-pth'
    }, function(err, mock) {
      if (err) throw err;
      t.same(mock.request.badge.attributes.public_path, '4-badge-hashed-pth');
      t.end();
    });
  });

  test('badge#findByUrl returns 404 when url is invalid', function(t) {
    conmock({
      handler: badge.findByUrl,
      param: 'badurl'
    }, function(err, mock) {
      if (err) throw err;
      t.equal(mock.request.badge, undefined);
      t.same(mock.status, 404);
      t.end();
    });
  });

  test('badge#save does not leave body serialized as JSON', function(t) {
    var b = fixtures['3-badge-raw'];
    t.same(b.get('body').recipient, 'brian@example.org');
    b.save(function(err) {
      if (err) throw err;
      t.same(b.get('body').recipient, 'brian@example.org');
      t.end();
    });
  });

  test('badge#share works when public_path doesn\'t exist', function(t) {
    var b = fixtures['3-badge-raw'];
    t.same(b.get('public_path'), undefined, 'public_path doesn\'t exist');
    conmock({
      handler: badge.share,
      request: {badge: b}
    }, function(err, mock) {
      if (err) throw err;
      t.same(b.get('public_path'), b.attributes.body_hash,
             'public_path was created');
      t.same(mock.status, 303);
      t.same(mock.fntype, 'redirect');
      t.same(mock.path, '/share/badge/' + b.attributes.body_hash);
      t.end();
    });
  });

  test('badge#share works when public_path already exists', function(t) {
    t.same(fixtures['5-badge-hashed'].get('public_path'),
           '4-badge-hashed-pth', 'public_path already exists');
    conmock({
      handler: badge.share,
      request: {
        badge: fixtures['5-badge-hashed']
      }
    }, function(err, mock) {
      if (err) throw err;
      t.same(mock.status, 303);
      t.same(mock.fntype, 'redirect');
      t.same(mock.path, '/share/badge/4-badge-hashed-pth');
      t.end();
    });
  });

  test('badge#show', function(t) {
    conmock({
      handler: badge.show,
      request: {
        badge: fixtures['5-badge-hashed']
      }
    }, function(err, mock) {
      if (err) throw err;
      t.same(mock.status, 200, '200 returned');
      t.same(mock.fntype, 'render');
      t.same(mock.path, 'badge-shared.html');
      t.same(mock.options.badge.attributes.public_path, '4-badge-hashed-pth');
      t.end();
    });
  });

  test('badge#destroy', function (t) {
    const owner = fixtures['1-real-user'];
    const thief = fixtures['2-false-user'];
    const badgeRaw = fixtures['3-badge-raw'];
    const badgeHashed = fixtures['5-badge-hashed'];
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

  test('badge#image', function (t) {
    const badgeImageRaw = fixtures['4-badge-raw-image'];
    const badgeImageHashed = fixtures['6-badge-hashed-image'];
    const handler = badge.image;

    const expect = images.unbaked;

    conmock({
      handler: handler,
      request: { badgeImage: badgeImageRaw },
    }, function (err, mock) {
      t.same(mock.body, expect);
    });

    conmock({
      handler: handler,
      request: { badgeImage: badgeImageHashed },
    }, function (err, mock) {
      t.same(mock.body, expect);
    });

    conmock({
      handler: handler,
      request: { },
    }, function (err, mock) {
      t.same(mock.status, 404);
      t.end();
    });
  });

  testUtils.finish(test);
});

