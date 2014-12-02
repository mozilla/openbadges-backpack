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
  '2-existing-png-badge': new Badge({
    user_id: 1,
    endpoint: 'pizza',
    image_path: 'path',
    body: $.makeAssertion()
  }),
  '3-existing-png-badge-image': new BadgeImage({
    badge_hash: Badge.createHash($.makeAssertion()),
    image_data: images.png.unbaked.toString('base64'),
    baked: 0,
  }),
  '4-existing-svg-badge': new Badge({
    user_id: 1,
    endpoint: 'pizza',
    image_path: 'path',
    body: $.makeAssertion({ "issued_on": "2011-08-24" })
  }),
  '5-existing-svg-badge-image': new BadgeImage({
    badge_hash: Badge.createHash(
                  $.makeAssertion({ "issued_on": "2011-08-24" })
                ),
    image_data: images.svg.unbaked.toString('base64'),
    baked: 0,
  }),
}, function (fixtures) {

  test('Finding a badge image ', function (t) {
    const expect = fixtures['3-existing-png-badge-image'];
    const badge = fixtures['2-existing-png-badge'];
    const where = { badge_hash: badge.get('body_hash' )};
    BadgeImage.findOne(where, function (err, image) {
      t.same(image.attributes, expect.attributes);
      t.end();
    });
  });

  test('BadgeImage#toBuffer', function (t) {
    const badgePngImage = fixtures['3-existing-png-badge-image'];
    const badgeSvgImage = fixtures['5-existing-svg-badge-image'];
    t.same(badgePngImage.toBuffer(), images.png.unbaked);
    t.same(badgeSvgImage.toBuffer(), images.svg.unbaked);
    t.end();
  });

  test('BadgeImage#bakeAndSave', function (t) {

    const badgePngImage  = fixtures['3-existing-png-badge-image'];
    const unbakedPngData = badgePngImage.toBuffer()

    const badgeSvgImage  = fixtures['5-existing-svg-badge-image'];
    const unbakedSvgData = badgeSvgImage.toBuffer()

    badgePngImage.bakeAndSave(function (err, image) {
      t.notOk(err, 'no error')

      const isRawPng =
        image
          .get('image_data')
          .toString('utf8')
          .slice(1, 4) == 'PNG'

      t.notOk(isRawPng, 'should not be a raw PNG')

      const bakedData = image.toBuffer()
      t.ok(image.get('baked'), 'image says its baked')
      t.notOk(bakedData == unbakedPngData, 'not the same')

      bakery.extract(bakedData, function (err, result) {
        t.same(JSON.parse(result).verify.url, 'pizza', 'should have pizza')
      })
    })

    badgeSvgImage.bakeAndSave(function (err, image) {
      t.notOk(err, 'no error')

      const rawSvg = new Buffer(image.get('image_data'), 'base64').toString('utf8')
      const isSvg = rawSvg.slice(0, 5) == '<?xml'
      const isBakedSvg = rawSvg.slice(101, 117) == 'xmlns:openbadges'

      t.ok(isSvg, 'should be an SVG')
      t.ok(isBakedSvg, 'should be a baked SVG')

      const bakedData = image.toBuffer()
      t.ok(image.get('baked'), 'image says its baked')
      t.notOk(bakedData == unbakedSvgData, 'not the same')

      bakery.extract(bakedData, function (err, result) {
        t.same(JSON.parse(result).verify.url, 'pizza', 'should have pizza')
        t.end();
      })
    })
  });

  $.finish(test);
})
