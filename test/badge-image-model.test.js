const $ = require('./');
const User = require('../models/user');
const Badge = require('../models/badge');
const BadgeImage = require('../models/badge-image');
const test = require('tap').test;
const images = require('./test-images');
const bakery = require('openbadges-bakery')

$.prepareDatabase({
  '1-user': new User({
    email: 'brian@example.com'
  }),
  '2-existing-badge': new Badge({
    user_id: 1,
    endpoint: 'pizza',
    image_path: 'path',
    body: $.makeAssertion()
  }),
  '3-existing-badge-image': new BadgeImage({
    badge_hash: Badge.createHash($.makeAssertion()),
    image_data: images.png.unbaked.toString('base64'),
    baked: 0,
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
    t.same(badgeimage.toBuffer(), images.png.unbaked);
    t.end();
  });

  test('BadgeImage#bakeAndSave', function (t) {
    const badgeimage = fixtures['3-existing-badge-image'];
    const unbakedData = badgeimage.toBuffer()
    badgeimage.bakeAndSave(function (err, image) {
      t.notOk(err, 'no error')

      const isRawPng =
        image
          .get('image_data')
          .toString('utf8')
          .slice(1, 4) == 'PNG'

      t.notOk(isRawPng, 'should not be a raw PNG')

      const bakedData = image.toBuffer()
      t.ok(image.get('baked'), 'image says its baked')
      t.notOk(bakedData == unbakedData, 'not the same')

      bakery.extract(bakedData, function (err, result) {
        t.same(JSON.parse(result).verify.url, 'pizza', 'should have pizza')
        t.end();
      })
    })
  });

  $.finish(test);
})
