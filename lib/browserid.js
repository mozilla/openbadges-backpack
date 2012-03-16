var request = require('request');

/**
 * Verify an assertion and pull data from it.
 *
 * @param {URL} url for verifier
 * @param {String} assertion string returned by browserID handshake
 * @param {String} audience the origin of the rp (i.e., this site)
 * @param {Function} callback will be called with 
 */
exports.verify = function verifyBrowserIdAssertion (url, assertion, audience, callback) {
  var opts = {
    method: 'POST',
    form : { assertion: assertion, audience: audience },
    url: url
  }
  request(opts, function (err, resp, body) {
    var verifierResponse = {};
    if (err) return callback(err);
    
    // Immediately bail on any code other than 200.
    if (resp.statusCode !== 200) {
      err = new Error('BrowserID verifier did not respond with HTTP 200');
      err.type = 'invalid_http_response';
      err.body = body;
      return callback(err);
    }
    
    // If we can't parse it, we can't know if it's verified.
    try {
      verifierResponse = (typeof body === 'object' ? body : JSON.parse(body));
    } catch (err) {
      err.type = 'parse_error';
      err.body = 'Could not parse JSON: ' + err.message;
      return callback(err);
    }
    
    // Make sure the verifier says this is legit.
    if (verifierResponse.status !== 'okay') {
      err = new Error('BrowserID verifier did not respond with HTTP 200');
      err.type = 'invalid_assertion';
      err.body = body;
      return callback(err);
    }
    
    // Everything looks good, send back the data
    return callback(null, verifierResponse);
  });
};
