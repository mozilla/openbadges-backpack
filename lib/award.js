var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var logger = require('./logging').logger;
var configuration = require('./configuration');
var baker = require('./baker');
var Badge = require('../models/badge');
var User = require('../models/user');

/**
 * Hash an object using md5 to generate a unique name.
 *
 * @param {Object} obj the object which will get serialized and hashed
 * @return {String} md5 hash of the serialized object.
 */

function md5obj(obj) {
  var sum = crypto.createHash('md5');
  var serialized = JSON.stringify(obj);
  return sum.update(serialized).digest('hex');
}


/**
 * Associated an incoming badge with a user.
 * - User is created if necessary by `User.findOrCreate`
 * - Depends on configuration variable `badge_path`
 *
 * @param {HashMap} opt the list of options, including the below
 *   @param {HashMap} assertion the badge assertion to save
 *   @param {Buffer}  recipient the recipient of this badge
 *   @param {String}  url the URL endpoint at the issuer where the assertion is hosted
 *   @param {Buffer}  imagedata the image data for the badge image (pre-baked).
 *
 * @param {Function} callback function expecting an error object or a badge object.
 */

function award(opts, callback) {
  const badgeDir = configuration.get('badge_path');
  const filename = md5obj(opts.assertion) + '.png';
  const filepath = path.join(badgeDir, filename);

  callback = callback || function () {};

  User.findOrCreate(opts.recipient, function (err, user) {
    if (err) return callback(err);

    // #TODO: figure out badge baking for signed badges. Also, use
    // `openbadges-bakery` for this.
    const baked = !!baker.getDataFromImage(opts.imagedata);
    if (!baked && opts.url)
      opts.imagedata = baker.prepare(opts.imagedata, opts.url);

    fs.writeFile(filepath, opts.imagedata, function (err) {
      if (err) return callback(err);

      new Badge({
        body: opts.assertion,
        user_id: user.get('id'),
        endpoint: opts.url,
        signature: opts.signature,
        public_path: opts.public_path,
        image_path: path.join(badgeDir.replace(/^.*?static/, ''), filename),
        image_data: opts.imagedata.toString('base64')
      }).save(callback);
    });
  });
}

module.exports = award;
