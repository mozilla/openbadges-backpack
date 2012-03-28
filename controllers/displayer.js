var _ = require('underscore');
var Group = require('../models/group.js');
var Badge = require('../models/badge.js');
var User = require('../models/user.js');

exports.param = {
  userId: function(request, response, next, id) {
    // make sure to always return 200 to jsonp or else it will fail
    // silently on the client -- the user agent won't bother to make
    // a script tag if the resource is "not found".
    var jsonp = request.query.callback
    
    User.findById(id, function(err, user) {
      if (err) {
        logger.error("Error pulling user: " + err);
        return response.send(formatter({
          status: 'error',
          error: 'Could not pull user'
        }, request), jsonp ? 200: 500);
      }
      
      if (!user || !user.get('id'))
        return response.send(formatter({
          status: 'missing',
          error: 'Could not find user'
        }, request), jsonp ? 200: 404)
      
      request.paramUser = user;
      return next();
    });
  }
}

function displayerAPIVersion (request, response, next) {
  response.send(formatter({status: 'okay', version: '0.5.0'}, request))
}

function emailToUserId (request, response, next) {
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
  var user = request.paramUser
  var jsonp = request.query.callback
  if (!user || !user.get('id'))
    // make sure to always return 200 to jsonp or else it will fail
    // silently on the client -- the user agent won't bother to make
    // a script tag if the resource is "not found".
    return response.send(formatter({
      status: 'missing',
      error: 'Could not find user'
    }, request), jsonp ? 200: 404)
  
  var userId = user.get('id')
  
  Group.find({ user_id: userId, 'public': 1 }, function (err, groups) {
    var exposedGroupData = _.map(groups, function (group) {
      return {
        groupId: group.get('id'),
        name: group.get('name'),
        badges: group.get('badges').length
      }
    })
    
    var responseData = formatter({
      userId: userId,
      groups: exposedGroupData
    }, request)
    return response.send(responseData, 200)
  })
  
}

var formatters = {
  'application/json': function (responseData, request) {
    var callback = request.query.callback;
    if (!callback)
      return responseData;
    else 
      return callback + '(' + JSON.stringify(responseData) + ')'
  }
}

var formatter = function formatter (responseData, request) {
  var format = request.headers['accept'] || 'application/json';
  
  // extensions rule everything around me.
  if (request.url.match(/\.json$/)) format = 'application/json';
  
  return formatters[format](responseData, request);
}

exports.version = displayerAPIVersion;
exports.emailToUserId = emailToUserId;
exports.userGroups = userGroups;