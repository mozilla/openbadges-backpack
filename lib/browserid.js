var request = require('request');

/**
 * Verify an assertion and pull data from it.
 *
 * @param {URL} url for verifier
 * @param {String} assertion string returned by browserID handshake
 * @param {String} audience the origin of the rp (i.e., this site)
 * @param {Function} callback will be called with
 */
function verifyBrowserIdAssertion(url, assertion, audience, callback) {
  var opts = {
    method: 'POST',
    form : { assertion: assertion, audience: audience },
    url: url
  };

  request(opts, function (err, resp, body) {
    var verifierResponse = {};
    if (err) return callback(err);

    // Immediately bail on any code other than 200.
    if (resp.statusCode !== 200) {
      var responseError = new Error('BrowserID verifier did not respond with HTTP 200');
      responseError.type = 'invalid_http_response';
      responseError.body = body;
      return callback(responseError);
    }

    // If we can't parse it, we can't know if it's verified.
    try {
      verifierResponse = (typeof body === 'object' ? body : JSON.parse(body));
    } catch (parseError) {
      parseError.type = 'parse_error';
      parseError.body = 'Could not parse JSON: ' + err.message;
      return callback(parseError);
    }

    // Make sure the verifier says this is legit.
    if (verifierResponse.status !== 'okay') {
      var invalidError = new Error('BrowserID verifier did not respond with HTTP 200');
      invalidError.type = 'invalid_assertion';
      invalidError.body = body;
      return callback(invalidError);
    }

    // Everything looks good, send back the data
    return callback(null, verifierResponse);
  });
}

exports.verify = verifyBrowserIdAssertion;