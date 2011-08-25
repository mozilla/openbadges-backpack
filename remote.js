var request = require('request')
  , validator = require('./validator')

exports.process = function(url, onprocess, onsuccess){
  onsuccess = onsuccess || function(){ };
  try {
    request.get(url, function(err, resp, rawBody) {
      if (err || resp.statusCode >= 400) {
        return onprocess(null, {
          status: 'failure',
          error: 'unreachable',
          reason: 'could not reach endpoint (dns, 4xx or 5xx)'
        });
      }
      try {
        var assertion = JSON.parse(rawBody);
      } catch(e) {
        return onprocess(null, {
          status: 'failure',
          error: 'unaccepted',
          reason: 'could not parse json, or invalid content type'
        });
      }
      var validationResult = validator.validate(assertion);
      if (validationResult.status === 'success') {
        try { 
          var badgeID = onsuccess(assertion);
          return onprocess(null, {
            status: 'success',
            id: badgeID
          });
        } catch (e) {
          return onprocess(null, {
            status: 'failure',
            error: 'unknown',
            reason: 'there was a local error. it may be temporary, try again later?'
          });
        }
      } else {
        return onprocess(null, {
          status: 'failure',
          error: 'validation',
          reason: validationResult.errors
        });
      }
    })
  } catch(e) {
    return onprocess(null, {
      status: 'failure',
      error: 'unreachable',
      reason: 'could not reach endpoint (invalid url)'
    });
  }
  return;
}
