var request = require('request')
  , url = require('url')
  , path = require('path')
  , fs = require('fs')
  , qs = require('querystring')
  , logger = require('./lib/logging').logger
  , configuration = require('./lib/configuration')
  , baker = require('./baker')
  , remote = require('./remote')
  , crypto = require('crypto')
;

// #FIXME: CSRF
exports.authenticate = function(req, res) {
  // If `assertion` wasn't posted in, the user has no business here.
  // We could return 403 or redirect to login page. It's more polite
  // to just redirect to the login page.
  if (!req.body['assertion']) {
    return res.redirect('/login', 303);
  }

  // Setup the options and the post body for the verification request.
  // nginx invariably 411s if it doesn't find a content-length header, and
  // express, which is what the main browserid server runs, will refuse to
  // populate req.body unless the proper content-type is set.
  var ident = configuration.get('identity');
  var opts = {}
  opts.uri = ident.protocol + '://' +  ident.server + ident.path;
  opts.body = qs.stringify({
    assertion: req.body['assertion'],
    audience: configuration.get('hostname')
  });
  opts.headers = {
    'content-length': opts.body.length,
    'content-type': 'application/x-www-form-urlencoded'
  };

  request.post(opts, function(err, resp, body){
    var assertion = {}
    var hostname = configuration.get('hostname')

    // We need to make sure:
    //
    //   * the request could make it out of the system,
    //   * the other side responded with the A-OK,
    //   * with a valid JSON structure,
    //   * and a status of 'okay'
    //   * with the right hostname, matching this server
    //   * and coming from the issuer we expect.
    //
    // If any of these tests fail, throw an error, catch that error at the
    // bottom, and call `goBackWithError` to redirect to the previous page
    // with a human-friendly message telling the user to try again.
    function goBackWithError(msg) {
      req.flash('login_error', (msg || 'There was a problem authenticating, please try again.'));
      return res.redirect('back', 303)
    }
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

// #FIXME: CSRF
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

  // #TODO: support multiple users
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

// #TODO: don't return 200s if there's a problem
exports.baker = function(req, res) {
  var query = req.query || {}
    , issuer
    , image
    , imageURL
    , badge
    , md5sum
    , filename
    , accepts

  
  if (!query.assertion) {
    return res.render('baker', {
      title: 'Creator',
      login: false
    });
  }
  accepts = req.headers['accept'] || '';
  remote.assertion(query.assertion, function(err, data) {
    if (err.status !== 'success') {
      logger.warn('failed grabbing assertion for URL '+ query.assertion);
      logger.warn('reason: '+ JSON.stringify(err));
      return res.end(JSON.stringify(err))
    }
    issuer = url.parse(query.assertion);
    image = url.parse(data.badge.image);
    if (!image.hostname) {
      image.host = issuer.host;
      image.port = issuer.port;
      image.slashes = issuer.slashes;
      image.protocol = issuer.protocol;
      image.hostname = issuer.hostname;
    }
    imageURL = url.format(image);
    remote.badgeImage(imageURL, function(err, imagedata) {
      if (err) {
        logger.warn('failed grabbing badge image '+ imageURL);
        logger.warn('reason: '+ JSON.stringify(err));
        return res.end(JSON.stringify(err))
      }
      try {
        badge = baker.prepare(imagedata, query.assertion);
      } catch (e) {
        logger.error('failed writing badge image: '+ e);
        return res.end(JSON.stringify({
          status: 'failure',
          reason: 'processing',
          msg: 'could not write data to PNG: ' + e
        }));
      }

      if (accepts.match('application/json')) {
        res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify({'status':'success'}));
      }
      md5sum = crypto.createHash('md5');
      filename = md5sum.update(badge).digest('hex');
      res.setHeader('content-type', 'image/png');
      res.setHeader('content-length', badge.length);
      res.setHeader('content-disposition', 'attachment; filename="'+filename+'.png"');
      return res.end(badge);
    });
  });
}

exports.login = function(req, res) {
  // req.flash returns an array. Pass on the whole thing to the view and
  // decide there if we want to display all of them or just the first one.
  res.render('login', {
    error: req.flash('login_error')
  });
};
