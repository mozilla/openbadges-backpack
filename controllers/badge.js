const async = require('async');
const Badge = require('../models/badge');
const BadgeImage = require('../models/badge-image');
const logger = require('../lib/logging').logger;
const utils = require('../lib/utils');

function respond(status, message) {
  return { status: status, message: message };
}

/**
 * Route param pre-condition for finding a badge when a badgeId is present.
 * If the badge cannot be found, immediately return HTTP 404.
 *
 * @param {String} hash is the `body_hash` of the badge to look up.
 */

exports.findById = function findById(req, res, next, id) {
  Badge.findById(id, function (err, badge) {
    if (!badge)
      return res.send(respond('missing', 'could not find badge'), 404);

    req.badge = badge;
    return next();
  });
};

/**
 * Route param pre-condition for finding a badge when a badgeUrl is present.
 * If the badge cannot be found, immediately return HTTP 404.
 *
 * @param {String} url is the `public_path` of the badge to look up.
 */

exports.findByUrl = function findByUrl(req, res, next, url) {
  Badge.findByUrl(url, function (err, badge) {
    if (!badge)
      return res.send(respond('missing', 'could not find badge'), 404);

    req.badge = badge;
    return next();
  });
};

exports.findByHash = function findByHash (req, res, next, hash) {
  BadgeImage.findOne({badge_hash: hash}, function (err, image) {
    if (err)
      return next(err);
    if (!image)
      return res.render('errors/404.html', {url: req.url});
    req.badgeImage = image;
    return next();
  })
};

exports.image = function image(req, res, next) {
  const image = req.badgeImage;
  if (!image) return res.send(404);
  res.type('image/png');
  return res.send(200, image.toBuffer());
}

exports.share = function share(req, res, next) {
  req.badge.share(function(err, badge) {
    if (err) throw err;
    return res.redirect('/share/badge/' + badge.attributes.public_path, 303);
  });
};

exports.show = function show(req, res, next) {
  res.render('badge-shared.html', {
    badge: req.badge,
    og: [
      { property: 'type', content: 'open-badges:badge' },
      { property: 'title', content: req.badge.attributes.body.badge.issuer.name },
      { property: 'url', content: utils.fullUrl(req.url) },
      { property: 'image', content: req.badge.get('imageUrl') },
      { property: 'description', content: req.badge.attributes.body.badge.description },
      ],
    fb: [
      { property: 'app_id', content: '268806889891263' }
      ]
  });
};

/**
 * Completely delete a badge from the user's account.
 *
 * @return {HTTP 500|404|403|303}
 *   badge not given -> 404.
 *   user doesn't own the badge -> 403.
 *   error calling `Badge#destroy` -> 500
 *   success -> 200
 */

exports.destroy = function destroy(req, res) {
  const badge = req.badge;
  const user = req.user;
  if (!badge)
    return res.send(404, respond('missing', "Cannot delete a badge that doesn't exist"));
  if (!user || badge.get('user_id') !== user.get('id'))
    return res.send(403, respond('forbidden', "Cannot delete a badge you don't own"));
  async.series([
    function destroyBadgeImage(callback) {
      const condition = { badge_hash: badge.get('body_hash') };
      BadgeImage.findAndDestroy(condition, callback)
    },
    function destroyBadge(callback) {
      badge.destroy(callback);
    }
  ], function (err, results) {
    if (err) {
      logger.warn('Failed to delete badge');
      logger.warn(err);
      return res.send(500, respond('error', 'Could not delete badge: ' + err));
    }
    return res.send(200, { status: 'okay' });
  });
};
