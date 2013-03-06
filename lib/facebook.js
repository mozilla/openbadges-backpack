// Library for making server-side calls to the Facebook API
var request = require('request');
var utils = require('../lib/utils');

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
    if (error) {
      return callback(body, null);
    } else {
      data = JSON.parse(body);
      return callback(null, body);
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
    if (error) {
      return callback(response, null);
    } else {
      data = JSON.parse(response);
      return callback(null, data);
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
    if (error) {
	    return callback(body, null);
    } else {
	    var data = JSON.parse(body);
      return callback(null, data);
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
    if (error) {
      return callback(body, null);
    } else {
      // use regex to parse the access token from the returned query string
      re = /access_token=+(.*)&expires=/;
      var match = body.match(re);
      var access_token = match[1];

      return callback(null, access_token);
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
	  if (error) {
		  return callback(body, null);
	  } else {
		  return callback(null, body);
	  }
	});	
}