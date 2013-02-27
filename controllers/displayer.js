var _ = require('underscore');
var Group = require('../models/group.js');
var Badge = require('../models/badge.js');
var User = require('../models/user.js');
var conf = require('../lib/configuration');
var logger = require('../lib/logging').logger;
var utils = require('../lib/utils');

// Helpers
// -------
var FORMATTERS = {
  'application/json': function (responseData, request) {
    var callback = request.query.callback;
    if (!callback)
      return responseData;
    return callback + '(' + JSON.stringify(responseData) + ')';
  }
};


/**
 * Determine the requested format by either accept header or extension.
 * If a format cannot be determined, defaults to "application/json".
 *
 * @param {Request} req The incoming request object
 * @return {String} requested format.
 */

function determineFormat(req) {
  var accept = req.headers['accept'];
  var url = req.url.split('?')[0]
  var format = accept || 'application/json';
  if (url.match(/\.json(p?)$/))
    format = 'application/json';
  return format;
}

/**
 * Log errors with the formatter.
 *
 * @param {Request} req The incoming request object
 */

function logFormatterError(req) {
  logger.debug('could not find a formatter for api request');
  logger.debug('  url: ' + req.url);
  logger.debug('  accept header: ' + req.headers['accept']);
}

/**
 * Send out a response in the format requested by the user-agent.
 *
 * @param {Object} data The object to respond with
 * @param {Request} req The incoming HTTP request object
 * @param {Response} res The HTTP response object
 */

function formatResponse(data, req, res) {
  var jsonp = req.query.callback;
  var status = jsonp
    ? 200
    : (data.httpStatus || 200);
  var format = determineFormat(req);
  var formatter = FORMATTERS[format];
  var responseBody;
  if (!formatter) {
    logFormatterError(req);
    res.type('txt');
    return res.send(400, 'error: could not find formatter');
  }
  responseBody = formatter(data, req);
  res.type(format);
  return res.send(status, responseBody);
}

// Parameter Handlers
// ------------------

/**
 * (Param Handler) Find a group by its ID
 */

exports.findGroupById = function findGroupById(req, res, next, id) {
  Group.findById(id, function (err, group) {
    if (err)
      return next(err);
    if (!group)
      return formatResponse({
        httpStatus: 404,
        status: 'missing',
      }, req, res);
    req.group = group;
    return next();
  });
};

/**
 * (Param Handler) Find a user by its ID
 */

exports.findUserById = function findUserById(req, res, next, id) {
  User.findById(id, function (err, user) {
    if (err)
      return next(err);
    if (!user)
      return formatResponse({
        httpStatus: 404,
        status: 'missing',
      }, req, res);
    req.user = user;
    return next();
  });
};


// Controllers
// ------------

/**
 * Show form for converting from email to userID
 */

exports.emailToUserIdView = function emailToUserIdView(req, res, next) {
  return res.render('email-converter.html');
};


/**
 * Convert an email address to a userID.
 */

exports.emailToUserId = function emailToUserId(req, res, next) {
  // don't use formatter here -- we aren't supporting jsonp or CORS for
  // the email to userId API because we want to discourage people including
  // email addresses in cleartext (such as in the source of some javascript)
  var obj = req.body || {};
  var email = obj['email'];

  if (!email)
    return res.send(400, {
      status: 'invalid',
      error: 'missing `email` parameter'
    });

  User.findOne({ email: email }, function (err, user) {
    if (err) {
      logger.debug('displayer#emailToUserId: there was an error getting the user');
      logger.debug('email: ' + email);
      logger.debug('error: ' + JSON.stringify(err));
      return res.send(400, {
        status: 'error',
        error: 'error trying to pull user `' + email + '` from database'
      });
    }

    if (!user) {
      return res.send(404, {
        status: 'missing',
        error: 'Could not find a user by the email address `' + email + '`'
      });
    }

    return res.send(200, {
      status: 'okay',
      email: email,
      userId: user.get('id')
    });
  });
};


/**
 * Get all of the public groups for a user. Only lists group IDs, not
 * the badges in the group.
 *
 * This is expected to come after some middleware that either sets
 * `req.user` or 404s.
 *
 * @see `findUserById`
 */

exports.userGroups = function userGroups(req, res, next) {
  var user = req.user;
  var jsonp = req.query.callback;
  var userId = user.get('id');
  var query = { user_id: userId, 'public': 1 };

  Group.find(query, function (err, groups) {
    var exposedGroupData = _.map(groups, function (group) {
      return {
        groupId: group.get('id'),
        name: group.get('name'),
        badges: group.get('badges').length
      };
    });

    return formatResponse({
      userId: userId,
      groups: exposedGroupData
    }, req, res);
  });
};

/**
 * Get all of the badges within a specific group.
 */

exports.userGroupBadges = function userGroupBadges(req, res, next) {
  var user = req.user;
  var group = req.group;
  var userOwnsGroup = (user.get('id') === group.get('user_id'));
  var groupIsPublic = !!group.get('public');

  if (!userOwnsGroup || !groupIsPublic) {
    return formatResponse({
      httpStatus: 404,
      status: 'missing'
    }, req, res);
  }

  group.getBadgeObjects(function (err, badges) {
    // #TODO: revisit this when we implement signed badges
    var exposedBadgeData = _.map(badges, function (badge) {
      return {
        lastValidated: badge.get('validated_on'),
        assertionType: badge.get('type'),
        hostedUrl: badge.get('endpoint'),
        assertion: badge.get('body'),
        imageUrl: utils.fullUrl(badge.get('image_path'))
      };
    });
    return formatResponse({
      userId: user.get('id'),
      groupId: group.get('id'),
      badges: exposedBadgeData
    }, req, res);
  });
};
