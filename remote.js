var request = require('request')
  , validator = require('./lib/validator')

function error(type, msg) { return {status: 'failure', error: type, reason: msg}; }
function errUnreachable(msg) { return error('unreachable', msg) };
function errUnknown(msg) { return error('unknown', msg); }
function errUnaccepted(msg) { return error('unaccepted', msg); }
function errValidation(msg) { return error('validation', msg); }

exports.assertion = function(url, callback){
  var assertion
    , validationResult
    , badgeID
  try {
    request.get(url, function(err, resp, rawBody) {
      if (err || resp.statusCode >= 400) {
        return callback(errUnreachable('could not reach endpoint (dns, 4xx or 5xx)'));
      }
      try {
        assertion = JSON.parse(rawBody);
      } catch(e) {
        return callback(errUnaccepted('could not parse json or invalid content-type'))
      }
      
      validationResult = validator.validate(assertion);
      if (validationResult.status === 'success') {
        return callback({status: 'success'}, assertion);
      } else {
        return callback(errValidation(validationResult.errors));
      }
    })
  } catch(e) {
    return callback(errUnreachable('could not reach endpoint (invalid url)'))
  }
}
