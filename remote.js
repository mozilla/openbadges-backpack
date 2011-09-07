var request = require('request')
  , validator = require('./lib/validator')

function _error(type, msg) {
  return {status: 'failure', error: type, reason: msg};
}
function getRemoteData(url, callback) {
  try {
    request.get(url, function(err, resp, rawBody) {
      if (err || resp.statusCode >= 400) {
        return callback(_error('unreachable', 'could not reach endpoint (dns, 4xx or 5xx)'));
      }
      return callback(null, rawBody);
    })
  } catch(e) {
    return callback(_error('unreachable', 'could not reach endpoint (invalid url)'))
  }
}

exports.assertion = function(url, callback){
  var assertion, validation;
  getRemoteData(url, function(err, data){
    if (err) return callback(err);
    try {
      assertion = JSON.parse(data);
    } catch(e) {
      return callback(_error('unaccepted', 'could not parse json or invalid content-type'))
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
