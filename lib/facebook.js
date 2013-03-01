// Library for making server-side calls to the Facebook API
var request = require('request');

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
  request(
		{ method: 'POST',
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
exports.publishBadge = function (access_token, badge_id, user_id, callback) {
	var fb_namespace = 'open-badges';
	var action = 'award';
	var object_name = 'badge';
	
	// look up the share url for a badge based-upon its badge_id
	// for now this is hard-coded, but it needs to change
	var object_url = 'http://openbadgesfb.herokuapp.com/badge/11';
	
  publishOpenGraphObject(user_id, access_token, fb_namespace, object_name, action, object_url, function(error, response) {
    if (error) {
	    callback(response, null);
    } else {
		  callback(null, response);
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
        callback(null, body);
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
	      data = JSON.parse(body);
		    console.log(data.error.code);
		    if (data.error.code == 190) {
			    return "Session has expired. Please login."
	      }
      } else {
		    // use regex to parse the access token from the returned query string
        re = /access_token=+(.*)&expires=/;
				var match = body.match(re);
				var access_token = match[1];
				
				callback(access_token);
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