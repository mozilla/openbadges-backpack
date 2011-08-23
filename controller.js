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
    function goBackWithError(msg) {
      req.flash('login_error', (msg || '<strong>Oh no!</strong> There was a problem, please try again.'));
      res.redirect('back', 303)
    }
    
    // testing -- just fail immediately
    return goBackWithError()
    
    
    if (err || resp.statusCode != 200) {
      logger.warn('identity server returned error: ');
      logger.debug('  status code: ' + resp.statusCode);
      logger.debug('  err obj: ' + JSON.stringify(err));
      logger.debug('  sent with these options: ' + JSON.stringify(options));
      return goBackWithError();
    }
    // try to parse response
    try {
      assertion = JSON.parse(body);
    } catch (syntaxError) {
      logger.warn('could not parse response from identity server: ' + body)
      return goBackWithError();
    }

    if (assertion.status !== 'okay') {
      logger.warn('did not get an affirmative response from identity server:');
      logger.warn(JSON.stringify(assertion));
      return goBackWithError();
    }
    var hostname = configuration.get('hostname')
    if (assertion.audience !== hostname) {
      logger.warn('unexpected audience for this assertion, expecting ' + hostname +'; got ' + assertion.audience);
      return goBackWithError();
    }
    if (assertion.issuer !== ident.server) {
      logger.warn('unexpected issuer for this assertion, expecting ' + ident.server +'; got ' + assertion.issuer);
      return goBackWithError();
    }

    // everything seems to be in order
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
 