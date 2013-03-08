// Library for making server-side calls to the Facebook API
var request = require('request');
var utils = require('../lib/utils');
var querystring = require('querystring');

exports.BASE_URL = 'https://graph.facebook.com';

/**
 * Publish an Open Graph object to Facebook.
 */
function publishOpenGraphObject (opts, callback) {
  request({
	  method: 'POST',
    uri: exports.BASE_URL + '/' + opts.userId + '/' + opts.fbNamespace + ':' +
         opts.action,
    qs: {
      'access_token': opts.accessToken,
      'badge': opts.objectUrl
    }
  }, function (error, response, body) {
	  var errorMsg = 'There was a problem sharing with Facebook.';
    if (error || (response.statusCode != 200)) {
      return callback(errorMsg, null);
    } else {
	    try {
	      data = JSON.parse(body);
	      return callback(null, data.id);
      } catch(err) {
        return callback(errorMsg, null);
      }
    }
  });
}

/**
 * Publishes a Badge Open Graph object to Facebook.
 */
exports.publishBadge = function (accessToken, badgeBodyHash, userId, callback) {
	var fbNamespace = 'open-badges';
	var action = 'award';
  var objectUrl = utils.fullUrl('/share/badge/' + badgeBodyHash);

  publishOpenGraphObject({
    'userId': userId,
    'accessToken': accessToken,
    'fbNamespace': fbNamespace,
    'action': action, 
    'objectUrl': objectUrl
  }, callback);
}

/**
 * Publishes a comment to a Facebook object
 */
exports.publishComment = function (objectId, accessToken, comment, callback) {
	request({
		method: 'POST',
		uri: exports.BASE_URL + '/' + objectId + '/comments',
    qs: {
			'access_token': accessToken,
			'message': comment
    }
  }, function (error, response, body) {
	  var errorMsg = 'There was a problem commenting on Facebook.';
    if (error || (response.statusCode != 200)) {
      return callback(errorMsg, null);
    } else {
      try {
	      var data = JSON.parse(body);
        return callback(null, data.id);
      } catch(err) {
	      return callback(errorMsg, null);
      }
    }
	});
}

/**
 * Extending client-side user access token
 * @returns long-lived user access token
 */
exports.extendUserAccessToken = function (appId, appSecret, accessToken, callback) {
	request({
		method: 'POST',
		uri: exports.BASE_URL + '/oauth/access_token',
    qs: {
      'grant_type': 'fb_exchange_token',
			'client_id': appId,
			'client_secret': appSecret,
			'fb_exchange_token': accessToken
    }
  }, function (error, response, body) {
	  var errorMsg = 'There was an error extending a user access token from Facebook.';
    if (error || (response.statusCode != 200)) {
      return callback(errorMsg, null);
    } else {
      try {
        var data = querystring.parse(body)
        return callback(null, data.access_token);
      } catch(err) {
	      return callback(errorMsg, null);
      }
    }
  });
}

/**
 * Checks if a user continues to give access to the backpack permission to publish actions
 */
exports.checkApplicationAccess = function (accessToken, appId, callback) {
	request({
		method: 'GET',
		uri: exports.BASE_URL + '/me/permissions',
    qs: {
      'access_token': accessToken,
      'app_id': appId
    }
  }, function (error, response, body) {
	  var errorMsg = 'There was an error checking if the Facebook application has permission.';
	  if (error || (response.statusCode != 200)) {
		  return callback(errorMsg, null);
	  } else {
		  try {
        resp = JSON.parse(body);
        if ((resp.data[0].installed == 1) && (resp.data[0].publish_actions == 1)) {
          return callback(null, true);
        } else {
          errorMsg = 'Incorrect Facebook permissions for the application to publish and access information.';
          throw errorMsg;
        }
      } catch(err) {
        return callback(errorMsg, null);
      }
	  }
	});	
}