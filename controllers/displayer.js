var _ = require('underscore');
var Group = require('../models/group.js');
var Badge = require('../models/badge.js');
var User = require('../models/user.js');

exports.param = {
  userId: function(request, response, next, id) {
    User.findById(id, function(err, user) {
      if (err) {
        logger.error("Error pulling user: " + err);
        return response.send({status: 'error', error: 'Could not pull user'}, 500);
      }
      
      if (!group)
        return response.send('Could not find user', 404);
      
      request.paramUser = user;
      return next();
    });
  }
}

function displayerAPIVersion (request, response, next) {
  response.send({status: 'okay', version: '0.5.0'})
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
  
  var user = request.paramUser;
  if (!user)
    return response.send({
      status: 'missing',
      error: 'Could not find user'
    }, 404);
  
  var userId = user.get('id');
  
  Group.find({ user_id: userId, 'public': 1 }, function (err, groups) {
    var exposedGroupData = _.map(groups, function (group) {
      return {
        groupId: group.get('id'),
        name: group.get('name'),
        badges: group.get('badges').length
      }
    });
    
    return response.send({
      userId: userId,
      groups: exposedGroupData
    }, 200);
  })
  
}

exports.version = displayerAPIVersion;
exports.emailToUserId = emailToUserId;
exports.userGroups = userGroups;