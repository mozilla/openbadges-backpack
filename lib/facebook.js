// Library for making server-side calls to the Facebook API
var request = require('request');
var utils = require('../lib/utils');
var querystring = require('querystring');

/**
 * Publish an Open Graph object to Facebook.
 */
function publishOpenGraphObject (opts, callback) {
  request({
	  method: 'POST',
    uri: 'https://graph.facebook.com/' + opts.user_id + '/' + opts.fb_namespace + ':' + opts.action,
    qs: {
      'access_token': opts.access_token,
      'badge': opts.object_url
      }
  }, function (error, response, body) {
	  var errorMsg = 'There was a problem sharing with Facebook.';
    if (error || (response.statusCode != 200)) {
      return callback(errorMsg, null);
    } else {
	    try {
	      data = JSON.parse(body);
	      return callback(null, data.access_token);
      } catch(err) {
        return callback(errorMsg, null);
      }
    }
  });
}

/**
 * Publishes a Badge Open Graph object to Facebook.
 */
exports.publishBadge = function (access_token, badge_body_hash, user_id, callback) {
	var fb_namespace = 'open-badges';
	var action = 'award';
  var object_url = utils.fullUrl('/share/badge/'+badge_body_hash);

  publishOpenGraphObject({'user_id': user_id, 'access_token': access_token, 'fb_namespace': fb_namespace, 'action': action, 'object_url': object_url}, function(error, response) {
	  var errorMsg = 'There was was a problem sharing a badge on Facebook.';
    if (error || (response.statusCode != 200)) {
      return callback(errorMsg, null);
    } else {
	    try {
        data = JSON.parse(response);
        return callback(null, data);
      } catch(err) {
        return callback(errorMsg, null);
	    }
    }
  });
}

/**
 * Publishes a comment to a Facebook object
 */
exports.publishComment = function (object_id, access_token, comment, callback) {
	request({
		method: 'POST',
		uri: 'https://graph.facebook.com/' + object_id + '/comments',
    qs: {
			'access_token': access_token,
			'message': comment
    }
  }, function (error, response, body) {
	  var errorMsg = 'There was a problem commenting on Facebook.';
    if (error || (response.statusCode != 200)) {
      return callback(errorMsg, null);
    } else {
      try {
	      var data = JSON.parse(body);
        return callback(null, data);
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
exports.extendUserAccessToken = function (app_id, app_secret, access_token, callback) {
	request({
		method: 'POST',
		uri: 'https://graph.facebook.com/oauth/access_token',
    qs: {
      'grant_type': 'fb_exchange_token',
			'client_id': app_id,
			'client_secret': app_secret,
			'fb_exchange_token': access_token
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
exports.checkApplicationAccess = function (access_token, app_id, callback) {
	request({
		method: 'GET',
		uri: 'https://graph.facebook.com/me/permissions',
    qs: {
      'access_token': access_token,
      'app_id': app_id
    }
  }, function (error, response, body) {
	  var errorMsg = 'There was an error checking if the Facebook application has permission.';
	  if (error || (response.statusCode != 200)) {
		  return callback(errorMsg, null);
	  } else {
		  try {
		    return callback(null, body);
      } catch(err) {
        return callback(errorMsg, null);
      }
	  }
	});	
}