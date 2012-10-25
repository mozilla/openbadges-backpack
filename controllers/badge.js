var Badge = require('../models/badge');
var logger = require('../lib/logging').logger;
var reverse = require('../lib/router').reverse;
var _ = require('lodash');

function respond(status, message) {
  return { status: status, message: message };
}

exports.param = {};

/**
 * Route param pre-condition for finding a badge when a badgeId is present.
 * If the badge cannot be found, immediately return HTTP 404.
 *
 * @param {String} hash is the `body_hash` of the badge to look up.
 */

exports.param['badgeId'] = function (request, response, next, id) {
  Badge.findById(id, function (err, badge) {
    if (!badge)
      return response.send(respond('missing', 'could not find badge'), 404);
    
    request.badge = badge;
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

exports.destroy = function destroy(request, response) {
  var badge = request.badge;  
  var user = request.user;
  function failNow() {
    return response.send(respond('forbidden', "Cannot delete a badge you don't own"), 403);
  }

  if(request.headers['accept'] && _(request.headers['accept']).contains('text/html')) {
    return response.redirect(reverse('backpack.login'), 303);
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

/**
 * Right now we just chuck the badge in there; in the future we
 * should normalize the data here for presentation.
 */
function showPage(response, opts) {
  response.render('badge-details.html', {
    attributes: opts.badge.attributes,
    assertion: opts.badge.attributes.body,
    badge: opts.badge.attributes.body.badge,
    issuer: opts.badge.attributes.body.badge.issuer,
    owner: opts.owner,
    editing: opts.editing
  });
}

/**
 * STUB: Individual badge view
 * Show the public view, logged in or not
 * Owner will see a preview message
 */
exports.show = function show(request, response) {
  var owner = request.user && request.badge.get('user_id') === request.user.get('id');
  showPage(response, {
    badge: request.badge,
    owner: owner,
    editing: false
  });
};

/**
 * STUB: Individual badge edit view
 * Show the badge with edit fields, owner only
 * Non-owner should be denied/redirected
 */
exports.edit = function show(request, response) {
  var owner = request.user && request.badge.get('user_id') === request.user.get('id');
  showPage(response, {
    badge: request.badge,
    owner: owner,
    editing: true
  });
};

exports.update = function update(request, response) {
  if (!request.user) {
    return response.send({
      status: 'forbidden',
      error: 'user required'
    }, 403);
  }

  if (!request.badge) {
    return response.send({
      status: 'missing-required',
      error: 'missing badge to update'
    }, 404);
  }

  if (request.user.get('id') !== request.badge.get('user_id')) {
    return response.send({
      status: 'forbidden',
      error: 'you cannot modify a group you do not own'
    }, 403);
  }

  if (!request.body) {
    return response.send({
      status: 'missing-required',
      error: 'missing fields to update'
    }, 400);
  }

  var badge = request.badge;
  var body = request.body;

  if(body.hasOwnProperty('public')) {
    if('boolean' === typeof body['public']) {
      badge.set('public', body['public']);
    } else {
      return response.send({
        status: 'invalid-field',
        error: 'privacy value is non-boolean'
      }, 400);
    }
  }

  if(body.hasOwnProperty('notes')) {
    if(null === body['notes'] || 'string' === typeof body['notes']) {
      badge.set('notes', body['notes']);
    } else {
      return response.send({
        status: 'invalid-field',
        error: 'notes must be either string or null'
      }, 400);
    }
  }

  badge.save(function (err) {
    if (err) {
      logger.debug('there was an error updating a badge:');
      logger.debug(err);
      return response.send({
        status: 'error',
        error: 'there was an unknown error. it has been logged.'
      }, 500);
    }

    response.contentType('json');
    response.send({status: 'okay'});
  });
};