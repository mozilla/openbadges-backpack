var request = require('request')
  , path = require('path')
  , qs = require('querystring')
  , logger = require('./lib/logging').logger
  , configuration = require('./lib/configuration')
;

// FIXME: CSRF
exports.authenticate = function(req, res) {
  // If `assertion` wasn't posted in, the user has no business here.
  // We could return 403 or redirect to login page. It's more polite
  // to just redirect to the login page.
  if (!req.body['assertion']) {
    return res.redirect('/login', 303);
  }
  // The browserid server we are going to be using.
  var ident = configuration.get('identity');
  var opts = {}
  
  // Setup options for the verification request.
  opts.uri = ident.protocol + '://' +  ident.server + ident.path;
  opts.body = qs.stringify({
    assertion: req.body['assertion'],
    audience: configuration.get('hostname')
  });
  
  // nginx invariably 411s if it doesn't find a content-length header, and
  // express, which is what the main browserid server runs, will refuse to
  // populate req.body unless the proper content-type is set.
  opts.headers = {
    'content-length': opts.body.length,
    'content-type': 'application/x-www-form-urlencoded'
  };

  request.post(opts, function(err, resp, body){
    var assertion = {}
    var hostname = configuration.get('hostname')
    
    // Store an error and return to the previous page.
    // Used in the testing battery below.
    function goBackWithError(msg) {
      req.flash('login_error', (msg || 'There was a problem authenticating, please try again.'));
      return res.redirect('back', 303)
    }
    
    // Make sure:
    // * the request could make it out of the system,
    // * the other side responded with the A-OK,
    // * with a valid JSON structure,
    // * and a status of 'okay'
    // * with the right hostname, matching this server
    // * and coming from the issuer we expect.
    // If any of these tests fail, immediately store an error to display
    // to the user and redirect to the previous page.
    try {
      if (err) {
        logger.error('could not make request to identity server')
        logger.error('  err obj: ' + JSON.stringify(err));
        throw 'could not request';
      }
      if (resp.statusCode != 200) {
        logger.warn('identity server returned error');
        logger.debug('  status code: ' + resp.statusCode);
        logger.debug('  sent with these options: ' + JSON.stringify(options));
        throw 'invalid http status';
      }
      try {
        assertion = JSON.parse(body);
      } catch (syntaxError) {
        logger.warn('could not parse response from identity server: ' + body)
        throw 'invalid response';
      }
      if (assertion.status !== 'okay') {
        logger.warn('did not get an affirmative response from identity server:');
        logger.warn(JSON.stringify(assertion));
        throw 'unexpected status';
      }
      if (assertion.audience !== hostname) {
        logger.warn('unexpected audience for this assertion, expecting ' + hostname +'; got ' + assertion.audience);
        throw 'unexpected audience';
      }
      if (assertion.issuer !== ident.server) {
        logger.warn('unexpected issuer for this assertion, expecting ' + ident.server +'; got ' + assertion.issuer);
        throw 'unexpected issuer';
      }
    } catch (validationError) {
      return goBackWithError();
    }

    // Everything seems to be in order, store the user's email in the session
    // and redirect to the front page.
    if (!req.session) res.session = {}
    req.session.authenticated = [assertion.email]
    return res.redirect('/', 303);
  })
};

// FIXME: CSRF
exports.signout = function(req, res) {
  var session = req.session;
  if (session) {
    Object.keys(session).forEach(function(k) {
      if (k !== 'csrf') delete session[k];
    });
  }
  res.redirect('/login', 303);
};

exports.manage = function(req, res) {
  if (!req.session || !req.session.authenticated) {
    return res.redirect('/login', 303);
  }
  
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
};

exports.login = function(req, res) {
  // req.flash returns an array. Pass on the whole thing to the view and
  // decide there if we want to display all of them or just the first one.
  res.render('login', {
    error: req.flash('login_error')
  });
};
 