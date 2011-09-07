var request = require('request')
  , validator = require('./lib/validator')

function _error(type, msg) {
  return {status: 'failure', error: type, reason: msg};
}
function getRemoteData(url, accepted, callback) {
  try {
    request.get(url, function(err, resp, rawBody) {
      if (err || resp.statusCode >= 400) {
        return callback(_error('unreachable', 'could not reach endpoint (dns, 4xx or 5xx)'));
      }
      if (resp.headers['content-type'] !== accepted) {
        return callback(_error('content-type', 'invalid content-type: should be ' + accepted))
      }
      return callback(null, rawBody);
    })
  } catch(e) {
    return callback(_error('unreachable', 'could not reach endpoint (invalid url)'))
  }
}


// Get a remote assertion and make sure it's valid. If it's not, return a
// computer-readable error status along with a descriptive, user-friendly
// error message.
exports.assertion = function(url, callback){
  var assertion, validation;
  getRemoteData(url, 'application/json', function(err, data){
    if (err) return callback(err);
    try {
      assertion = JSON.parse(data);
    } catch(e) {
      return callback(_error('parse', 'could not parse json'))
    }
    validation = validator.validate(assertion);
    if (validation.status === 'success') {
      return callback({status: 'success'}, assertion);
    } else {
      return callback(_error('validation', validation.errors));
    }
    callback(err, data);
  });
}
