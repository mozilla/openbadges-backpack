// Library for making server-side calls to the Facebook API
var request = require('request');
var utils = require('../lib/utils');

/**
 * Publish an Open Graph object to Facebook.
 *
 * @param {Int|String} Facebook user ID or string representing 'me'
 * @param {String} Facebook access token
 * @param {String} Registered Facebook application namespace
 * @param {String} Registered object name that is being published
 * @param {String} Name of action performed when publishing object
 * @param {String} URL of the object and opengraph data
 */
function publishOpenGraphObject (user_id, access_token, fb_namespace, object_name, action, object_url, callback) {
  request({ method: 'POST',
    uri: 'https://graph.facebook.com/' + user_id + '/' + fb_namespace + ':' + action,
    qs: {
      'access_token': access_token,
      'badge': object_url
      }
    }, function (error, response, body) {
      if (error) {
        callback(body, null);
      } else {
        data = JSON.parse(body);
        callback(null, body);
      }
  });
}

/**
 * Publishes a Badge Open Graph object to Facebook.
 */
exports.publishBadge = function (access_token, badge_body_hash, user_id, callback) {
	var fb_namespace = 'open-badges';
	var action = 'award';
	var object_name = 'badge';
	
	var object_url = utils.fullUrl('/share/badge/'+badge_body_hash);
	
  publishOpenGraphObject(user_id, access_token, fb_namespace, object_name, action, object_url, function(error, response) {
    if (error) {
      callback(response, null);
    } else {
      data = JSON.parse(response);
      callback(null, data);
    }
  });
}

/**
 * Publishes a comment to a Facebook object
 */
exports.publishComment = function (object_id, access_token, comment, callback) {
	request(
		{ method: 'POST',
		  uri: 'https://graph.facebook.com/' + object_id + '/comments',
      qs: {
			  'access_token': access_token,
			  'message': comment
      }
    }, function (error, response, body) {
      if (error) {
	       callback(body, null);
      } else {
	      data = JSON.parse(body);
        callback(null, data);
      }
	});
}

/**
 * Extending client-side user access token
 * @returns long-lived user access token
 */
exports.extendUserAccessToken = function (app_id, app_secret, access_token, callback) {
	request(
		{ method: 'POST',
		  uri: 'https://graph.facebook.com/oauth/access_token',
      qs: {
			  'grant_type': 'fb_exchange_token',
			  'client_id': app_id,
			  'client_secret': app_secret,
			  'fb_exchange_token': access_token
      }
  }, function (error, response, body) {
    if (error) {
      callback(body, null);
    } else {
      // use regex to parse the access token from the returned query string
      re = /access_token=+(.*)&expires=/;
      var match = body.match(re);
      var access_token = match[1];

      callback(null, access_token);
    }
	});
}

/**
 * Checks if a user continues to give access to the backpack permission to publish actions
 */
exports.checkApplicationAccess = function (access_token, app_id, callback) {
	request(
		{ method: 'GET',
		  uri: 'https://graph.facebook.com/me/permissions',
      qs: {
			  'access_token': access_token,
			  'app_id': app_id
      }
    }, function (error, response, body) {
	    if (error) {
		    callback(body, null);
	    } else {
		    callback(null, body);
	    }
	});	
}