var request = require('request')
  , metapng = require('metapng')
  , Badge = require('./models/badge')

var MAX_RESPONSE_SIZE = 1024*256;
function _error(type, msg) {
  return {status: 'failure', error: type, reason: msg};
}
function getRemoteData(opts, accepted, callback) {
  try {
    // do a HEAD request first to see if the URL is reachable and within limits
    request({method:'head', url:opts.url}, function(err, resp) {
      if (err || resp.statusCode >= 400) {
        return callback(_error('unreachable', 'could not reach endpoint (dns, 4xx or 5xx)'));
      }
      var length = resp.headers['content-length'];
      if (length && length > MAX_RESPONSE_SIZE) {
        return callback(_error('size', 'response too big. max size is ' + MAX_RESPONSE_SIZE + 'kb'));
      }
      
      // even though we test reachability and size above, we should do it
      // again on the new GET request.
      request(opts, function(err, resp, rawBody) {
        if (err || resp.statusCode >= 400) {
          return callback(_error('unreachable', 'could not reach endpoint (dns, 4xx or 5xx)'));
        }
        if (resp.headers['content-type'].indexOf(accepted) !== 0) {
          return callback(_error('content-type', 'invalid content-type: should be ' + accepted))
        }
        // some servers don't misbehave and don't return a content-length on HEAD requests.
        if (rawBody.length > MAX_RESPONSE_SIZE) {
        return callback(_error('size', 'response too big. max size is ' + MAX_RESPONSE_SIZE + 'kb'));
        }
        return callback(null, rawBody);
      })
    })
  } catch(e) {
    return callback(_error('unreachable', 'could not reach endpoint (invalid url)'))
  }
}

exports.badgeImage = function(url, callback) {
  getRemoteData({url: url, encoding:'binary'}, 'image/png', function(err, data) {
    if (err) return callback(err);
    var pngbuf = Buffer(data, 'binary');
    try {
      metapng.read(pngbuf);
    } catch(e) {
      return callback(_error('parse', 'could not read png file: ' + e));
    }
    return callback(err, pngbuf);
  });
}

// Get a remote assertion and make sure it's valid. If it's not, return a
// computer-readable error status along with a descriptive, user-friendly
// error message.
exports.assertion = function(url, callback) {
  var assertion, validation, status, badge, errors = {};
  getRemoteData({url: url}, 'application/json', function(err, data) {
    if (err) return callback(err);
    try {
      assertion = JSON.parse(data);
    } catch(e) {
      return callback(_error('parse', 'could not parse json: ' + e))
    }
    badge = new Badge(assertion);
    badge.validate(function(err) {
      if (!err) {
        return callback({status: 'success'}, badge);
      } else {
        Object.keys(err.errors).forEach(function(f){
          errors[f] = err.errors[f].type;
        }) 
        status = _error('validation', errors)
        status.debug = assertion
        return callback(status);
      }
      callback(err, data);
    })
  });
}
