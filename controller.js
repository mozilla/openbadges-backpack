var configuration = require('./lib/configuration')
  , logger = require('./lib/logging').logger
  , request = require('request')
  , path = require('path')
  , qs = require('querystring')

// FIXME: CSRF
exports.authenticate = function(req, res) {
  // throw out 403 if we can't find assertion
  if (!req.body['assertion']) {
    res.status(403)
    res.end('forbidden');
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
      logger.warn('unexpected audience for this assertion, expecting ' + hostname +'; got ' + assertion.audience);
      return problem();
    }
    if (assertion.issuer !== ident.server) {
      logger.warn('unexpected issuer for this assertion, expecting ' + ident.server +'; got ' + assertion.issuer);
      return problem();
    }

    // everything seems to be in order
    if (!req.session) res.session = {}
    req.session.authenticated = [assertion.email]

    return res.redirect('/', 303);
  })
}

// FIXME: CSRF
exports.signout = function(req, res) {
  var session = req.session;
  if (session) {
    Object.keys(session).forEach(function(k) {
      if (k !== 'csrf') delete session[k];
    });
  }
  res.redirect('/login', 303);
}

exports.manage = function(req, res) {
  // TODO: support multiple users
  var session = req.session
    , user = session.authenticated[0]
    , emailRe = /^.+?\@.+?\.*$/
  
  // very simple sanity check
  if (!emailRe.test(user)) {
    logger.warn('session.authenticate does not contain valid user: ' + user);
    req.session = {};
    return res.redirect('/login', 303);
  }
  res.render('manage', {
    user: user,
    badges: []
  });
}