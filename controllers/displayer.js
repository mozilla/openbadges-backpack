var _ = require('underscore');
var Group = require('../models/group.js');
var Badge = require('../models/badge.js');
var User = require('../models/user.js');
var conf = require('../lib/configuration');
var logger = require('../lib/logging').logger


// Helpers
// -------
var formatters = {
  'application/json': function (responseData, request) {
    var callback = request.query.callback;
    if (!callback)
      return responseData;
    else 
      return callback + '(' + JSON.stringify(responseData) + ')'
  }
}

var formatResponse = function formatResponse (data, request, response) {
  var rawData = data
  var status = data.httpStatus
  var jsonp = request.query.callback
  var accept = request.headers['accept']
  var url = request.url
  
  // accept header is secondary as it will be less often used
  var format = accept || 'application/json'
  
  // extensions rule everything around me.
  if (url.match(/\.json(p?)$/)) format = 'application/json'
  
  // if we can't find a formatter, send out a plain text response.
  if (!formatters[format]) {
    logger.debug('could not find a formatter for api request')
    logger.debug('  url: ' + url)
    logger.debug('  accept header: ' + accept)
    response.contentType('txt')
    return response.send('error: could not find formatter', 400)
  }
  
  var preparedData = formatters[format](rawData, request)
  return response.send(preparedData, jsonp ? 200 : status);
}

var fullUrl = function fullUrl (pathname) {
  return require('url').format({
    protocol: conf.get('protocol'),
    hostname: conf.get('hostname'),
    port: conf.get('port'),
    pathname: pathname
  })
}


// Parameter Handlers
// ------------------

// make sure to always return 200 to jsonp or else it will fail
// silently on the client -- the user agent won't bother to make
// a script tag if the resource is "not found".
var findThing = function findThing (name) {
  var M = ({ user: User, group: Group })[name]
  return function thingFinder (request, response, next, id) {
    var jsonp = request.query.callback
    
    M.findById(id, function(err, thing) {
      if (err) {
        logger.error("Error pulling " + name + ": " + err);
        return formatResponse({
          httpStatus: 500,
          status: 'error',
          error: 'Could not pull ' + name
        }, request, response);
      }
      
      if (!thing || !thing.get('id'))
        return formatResponse({
          httpStatus: 404,
          status: 'missing',
          error: 'Could not find ' + name
        }, request, response)
      
      if (request[name]) request['_' + name] = request[name];
      request[name] = thing;
      return next();
    });
  }
}

exports.param = {
  dUserId: findThing('user'),
  dGroupId: findThing('group')
}


// Controllers
// ------------
function displayerAPIVersion (request, response, next) {
  return formatResponse({
    status: 'okay',
    version: '0.5.0'
  }, request, response)
}

function emailToUserIdView (request, response, next) {
  return response.render('email-converter');
}

function emailToUserId (request, response, next) {
  // don't use formatter here -- we aren't supporting jsonp or CORS for
  // the email to userId API because we want to discourage people including
  // email addresses in cleartext (such as in the source of some javascript)
  var obj = request.body || {};
  var email = obj['email'];
  
  if (!email)
    return response.send({
      status: 'invalid',
      error: 'missing `email` parameter'
    }, 400)
  
  User.findOne({ email: email }, function (err, user) {
    if (err) {
      logger.debug('displayer#emailToUserId: there was an error getting the user');
      logger.debug('email: ' + email);
      logger.debug('error: ' + JSON.stringify(err));
      return response.send({
        status: 'error',
        error: 'error trying to pull user `' + email + '` from database'
      }, 400)
    }
    
    if (!user)
      return response.send({
        status: 'missing',
        error: 'Could not find a user by the email address `' + email + '`'
      }, 404)
    
    else 
      return response.send({
        status: 'okay',
        email: email,
        userId: user.get('id')
      }, 200);
  })
}

function userGroups (request, response, next) {
  var user = request.user
  var jsonp = request.query.callback
  if (!user || !user.get('id'))
    // make sure to always return 200 to jsonp or else it will fail
    // silently on the client -- the user agent won't bother to make
    // a script tag if the resource is "not found".
    return formatResponse({
      httpStatus: 404,
      status: 'missing',
      error: 'Could not find user'
    }, request, response)
  
  var userId = user.get('id')
  
  Group.find({ user_id: userId, 'public': 1 }, function (err, groups) {
    var exposedGroupData = _.map(groups, function (group) {
      return {
        groupId: group.get('id'),
        name: group.get('name'),
        badges: group.get('badges').length
      }
    })
    
    return formatResponse({
      userId: userId,
      groups: exposedGroupData
    }, request, response)
  })
  
}

function userGroupBadges (request, response, next) {
  var user = request.user
  var group = request.group
  var jsonp = request.query.callback
  
  // if the group exists but it's private, just pretend it doesn't exist
  if (!group.get('public'))
    return formatResponse({
      httpStatus: 404,
      status: 'missing',
      error: 'Could not find group'
    }, request, response) 
 
  group.getBadgeObjects(function (err, badges) {
    // #TODO: revisit this when we implement signed badges
    var exposedBadgeData = _.map(badges, function (badge) {
      return {
        lastValidated: badge.get('validated_on'),
        assertionType: badge.get('type'),
        hostedUrl: badge.get('endpoint'),
        assertion: badge.get('body'),
        imageUrl: fullUrl(badge.get('image_path')),
      }
    })
    return formatResponse({
      userId: user.get('id'),
      groupId: group.get('id'),
      badges: exposedBadgeData
    }, request, response)
  })
}

exports.version = displayerAPIVersion
exports.emailToUserId = emailToUserId
exports.emailToUserIdView = emailToUserIdView
exports.userGroups = userGroups
exports.userGroupBadges = userGroupBadges