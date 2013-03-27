const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('./logging').logger;
const configuration = require('./configuration');
const Badge = require('../models/badge');
const BadgeImage = require('../models/badge-image');
const User = require('../models/user');
const async = require('async');
const bakery = require('openbadges-bakery');

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
  const badgeDir = configuration.get('badge_path');
  const filename = md5obj(opts.assertion) + '.png';
  const filepath = path.join(badgeDir, filename);
  const originalImage = opts.imagedata||opts.imageData;

  async.parallel({
    user: function getUser(callback) {
      User.findOrCreate(opts.recipient, callback);
    },
    imageData: function checkBadgeBaked(callback) {
      if (!opts.url)
        return callback();
      bakery.extract(originalImage, function (err, data) {
        if (data)
          return callback(null, originalImage);
        bakery.bake({
          image: originalImage,
          data: opts.url
        }, callback);
      })
    }
  }, function (err, results) {
    if (err) return callback(err);
    const badge = new Badge({
      body: opts.assertion,
      user_id: results.user.get('id'),
      endpoint: opts.url,
      signature: opts.signature,
      public_path: opts.public_path,
      image_path: path.join(badgeDir.replace(/^.*?static/, ''), filename),
    });
    const badgeImage = new BadgeImage({
      badge_hash: Badge.createHash(opts.assertion),
      image_data: opts.imagedata.toString('base64')
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
