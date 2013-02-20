var Badge = require('../models/badge');
var logger = require('../lib/logging').logger;

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

exports.share = function share(req, res, next) {
  req.badge.share(function(err, badge) {
    if (err) throw err;
    return res.redirect('/share/badge/' + badge.attributes.public_path, 303);
  });
};

exports.show = function show(req, res, next) {
  res.render('badge-shared.html', {badge: req.badge});
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

exports.destroy = function destroy(request, response) {
  var badge = request.badge;
  var user = request.user;
  function failNow() {
    return response.send(respond('forbidden', "Cannot delete a badge you don't own"), 403);
  }

  if (!badge)
    return response.send(respond('missing', "Cannot delete a badge that doesn't exist"), 404);

  if (!user || badge.get('user_id') !== user.get('id'))
    return failNow();

  badge.destroy(function (err, badge) {
    if (err) {
      logger.warn('Failed to delete badge');
      logger.warn(err);
      return response.send(respond('error', 'Could not delete badge: ' + err), 500);
    }
    return response.send({ status: 'okay' }, 200);
  });
};


