const $ = require('./');
const User = require('../models/user');
const Badge = require('../models/badge');
const BadgeImage = require('../models/badge-image');
const test = require('tap').test;
const images = require('./test-images');

$.prepareDatabase({
  '1-user': new User({
    email: 'brian@example.com'
  }),
  '2-existing-badge': new Badge({
    user_id: 1,
    image_path: 'path',
    body: $.makeAssertion()
  }),
  '3-existing-badge-image': new BadgeImage({
    badge_hash: Badge.createHash($.makeAssertion()),
    image_data: images.unbaked.toString('base64')
  }),
}, function (fixtures) {

  test('Finding a badge image ', function (t) {
    const expect = fixtures['3-existing-badge-image'];
    const badge = fixtures['2-existing-badge'];
    const where = { badge_hash: badge.get('body_hash' )};
    BadgeImage.findOne(where, function (err, image) {
      t.same(image.attributes, expect.attributes);
      t.end();
    });
  });

  test('BadgeImage#toBuffer', function (t) {
    const badgeimage = fixtures['3-existing-badge-image'];
    t.same(badgeimage.toBuffer(), images.unbaked);
    t.end();
  });

  $.finish(test);
})