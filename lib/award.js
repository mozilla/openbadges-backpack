const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const configuration = require('./configuration');
const Badge = require('../models/badge');
const BadgeImage = require('../models/badge-image');
const User = require('../models/user');
const async = require('async');
const bakery = require('openbadges-bakery');
const xtend = require('xtend')

function md5obj(obj) {
  const sum = crypto.createHash('md5');
  const serialized = JSON.stringify(obj);
  return sum.update(serialized).digest('hex');
}


/**
 * Associated an incoming badge with a user.
 * - User is created if necessary by `User.findOrCreate`
 * - Depends on configuration variable `badge_path`
 *
 * @param {Object} opt the list of options, including the below
 *   - `assertion`
 *   - `recipient`
 *   - `url` or `signature`
 *   - `imagedata`
 */

function award(opts, callback) {
  callback = callback||function () {};
  var extension = ".png";
  if (opts.assertion.badge.image && opts.assertion.badge.image.slice(-4) == ".svg") extension = ".svg"
  const filename = md5obj(opts.assertion) + extension;
  const originalImage = opts.imagedata||opts.imageData;

  async.parallel({
    user: function getUser(callback) {
      User.findOrCreate(opts.recipient, callback);
    },
    imageData: function checkBadgeBaked(callback) {
      isBaked(originalImage, function (err, baked) {
        if (baked) return callback(null, originalImage)

        const bakeryOptions = createBakeryOptions(opts)
        bakery.bake(bakeryOptions, callback);
      })
    }
  }, function (err, results) {
    if (err) return callback(err);
    const user = results.user
    const bakedImage = results.imageData

    const badge = new Badge({
      body: opts.assertion,
      user_id: results.user.get('id'),
      endpoint: opts.url,
      signature: opts.signature,
      public_path: opts.publicPath,
      image_path: makeBadgeImagePath(filename),
    });

    const badgeImage = new BadgeImage({
      badge_hash: Badge.createHash(opts.assertion),
      image_data: Buffer(bakedImage).toString('base64'),
      baked: true,
    })

    async.series({
      badge: badge.save.bind(badge),
      image: badgeImage.save.bind(badgeImage)
    }, function (err, results) {
      return callback(err, results.badge);
    });
  });
}

module.exports = award;

function createBakeryOptions(opts) {
  const result = { image: opts.imagedata || opts.imageData }

  if (opts.signature) {
    result.signature = opts.signature
    return result
  }

  var assertion = opts.original || opts.assertion;

  // pre-1.0.0 assertions did not have a verify structure and we need
  // one for baking, so what we're gonna do here is just create one and
  // stick it to the assertion so the bakery can do its thing.
  if (!assertion.verify) {
    assertion = xtend(assertion, {
      verify: { type: 'hosted', url: opts.url }
    })
  }

  result.assertion = assertion
  return result
}

function makeBadgeImagePath(filename) {
  const badgeDir = configuration.get('badge_path');
  return path.join(badgeDir.replace(/^.*?static/, ''), filename)
}

function isBaked(image, callback) {
  bakery.extract(image, function (err, result) {
    return callback(null, !!result)
  })
}
