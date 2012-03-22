var Badge = require('../models/badge')
  , logger = require('../lib/logging').logger

exports.param = {};

/**
 * Route param pre-condition for finding a badge when a badgeId is present.
 * If the badge cannot be found, immediately return HTTP 404.
 *
 * @param {String} hash is the `body_hash` of the badge to look up.
 */

exports.param['badgeId'] = function(req, res, next, id) {
  Badge.findById(id, function(err, badge) {
    if (!badge) return res.send({
      status: 'missing',
      message: 'could not find badge'
    }, 404);
    req.badge = badge;
    return next();
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

exports.destroy = function (req, res) {
  var badge = req.badge;
  var user = req.user;
  var failNow = function () {
    return res.send({
      status: 'forbidden',
      message: "Cannot delete a badge you don't own"
    }, 403)
  };
  
  if (!badge) return res.send({
    status: 'missing',
    message: "Cannot delete a badge that doesn't exist"
  }, 404);
  
  if (!user) return failNow()
  
  if (badge.get('user_id') !== user.get('id')) return failNow()
  
  badge.destroy(function (err, badge) {
    if (err) {
      logger.warn('Failed to delete badge');
      logger.warn(err);
      return res.send({
        status: 'error',
        message: 'Could not delete badge: ' + err
      }, 500);
    }
    return res.send({status: 'okay'}, 200);
  })
};


