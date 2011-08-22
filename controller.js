var configuration = require('./lib/configuration')
  , logger = require('./lib/logging').logger
  , request = require('request')
  , path = require('path')
  , qs = require('querystring')

exports.authenticate = function(req, res) {
  // throw out 403 if we can't find assertion
  if (!req.body['assertion']) {
    res.status(403)
    res.send('forbidden');
    return;
  }
  var postbody = qs.stringify({
    assertion: req.body['assertion'],
    audience: configuration.get('hostname')
  });
  var ident = configuration.get('identity');
  var options = {
    uri: ident.protocol + '://' +  ident.server + ident.path,
    method: 'POST',
    headers: {
      // nginx invariably 411s without content-length
      'Content-Length': postbody.length,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: postbody
  };

  // FIXME: use proper respose statuses (httputil)
  request(options, function(err, resp, body){
    var assertion = {}
    function problem() { res.end('there was a problem, try again'); }
    if (err || resp.statusCode != 200) {
      logger.warn('identity server returned error: ');
      logger.warn('  status code: ' + resp.statusCode);
      logger.warn('  err obj: ' + JSON.stringify(err));
      logger.warn('  sent with these options: ' + JSON.stringify(options));
      return problem();
    }
    // try to parse response
    try {
      assertion = JSON.parse(body);
    } catch (syntaxError) {
      logger.warn('could not parse response from identity server: ' + body)
      return problem();
    }

    if (assertion.status !== 'okay') {
      logger.warn('did not get an affirmative response from identity server:');
      logger.warn(JSON.stringify(assertion));
      return problem();
    }
    var hostname = configuration.get('hostname')
    if (assertion.audience !== hostname) {
      logger.warn('unexpected audience for this assertion, expecting ' +
                  hostname +'; got ' + assertion.audience);
      return problem();
    }
    if (assertion.issuer !== ident.server) {
      logger.warn('unexpected issuer for this assertion, expecting ' +
                  ident.server +'; got ' + assertion.issuer);
      return problem();
    }

    // everything seems to be in order
    if (!req.session) res.session = {}
    req.session.authenticated = [assertion.email]

      // FIXME: redirect
    return res.end('worked');
  })
}

exports.manage = function(req, res){
  logger.warn('gon party');
  res.end('party timeeeeeeeeeeee');
  return;
}

