var request = require('request')
  , qs = require('querystring')
  , fs = require('fs')
  , logger = require('../lib/logging').logger
  , url = require('url')
  , configuration = require('../lib/configuration')
  , baker = require('../lib/baker')
  , remote = require('../lib/remote')
  , _award = require('../lib/award')
  , reverse = require('../lib/router').reverse
  , Badge = require('../models/badge')

exports.param = {};
exports.param['badgeId'] = function(req, res, next, id) {
  Badge.findOne({body_hash: id}, function(err, badge) {
    if (!badge) return res.send('could not find badge', 404);
    req.badge = badge;
    return next();
  });
};

exports.login = function(req, res) {
  // req.flash returns an array. Pass on the whole thing to the view and
  // decide there if we want to display all of them or just the first one.
  res.render('login', {
    error: req.flash('error'),
    csrfToken: req.session._csrf
  });
};

exports.authenticate = function(req, res) {
  // If `assertion` wasn't posted in, the user has no business here.
  // We could return 403 or redirect to login page. It's more polite
  // to just redirect to the login page.
  if (!req.body || !req.body['assertion']) {
    return res.redirect(reverse('backpack.login'), 303);
  }

  // Setup the options and the post body for the verification request.
  // nginx invariably 411s if it doesn't find a content-length header, and
  // express, which is what the main browserid server runs, will refuse to
  // populate req.body unless the proper content-type is set.
  var ident = configuration.get('identity');
  var opts = {};
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
    var assertion = {};
    var hostname = configuration.get('hostname');

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
      req.flash('error', (msg || 'There was a problem authenticating, please try again.'));
      return res.redirect('back', 303);
    }
    try {
      if (err) {
        logger.error('could not make request to identity server');
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
        logger.warn('could not parse response from identity server: ' + body);
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
    } catch (validationError) {
      return goBackWithError();
    }

    // Everything seems to be in order, store the user's email in the session
    // and redirect to the front page.
    if (!req.session) res.session = {};
    req.session.authenticated = [assertion.email];
    return res.redirect(reverse('backpack.manage'), 303);
  });
};

exports.signout = function(req, res) {
  var session = req.session;
  if (session) {
    Object.keys(session).forEach(function(k) {
      if (k !== 'csrf') delete session[k];
    });
  }
  res.redirect(reverse('backpack.login'), 303);
};

exports.manage = function(req, res, next) {
  var email = emailFromSession(req);
  if (!email) return res.redirect(reverse('backpack.login'), 303);
  var error = req.flash('error')
    , success = req.flash('success')
  

  // #TODO: replace below method with the new model methods.
  Badge.find({email: email}, function(err, badges){
    if (err) return next(err);
    
    badges.forEach(function (b) {
      b.detailsUrl = reverse('backpack.details', { badgeId: b.data.body_hash })
      return b;
    })
    
    res.render('manage', {
      error: error,
      success: success,
      user: email,
      badges: badges,
      groups: [], // #TODO: replace with real grouping
      fqrev: function(p, o){
        var u = url.parse(reverse(p, o))
        u.hostname = configuration.get('hostname');
        u.protocol = configuration.get('protocol');
        u.port = configuration.get('external_port');
        u.port = '80' ? null : u.port;
        return url.format(u);
      }
    });
  });
};

exports.details = function(req, res, next) {
  var badge = req.badge
    , email = emailFromSession(req)
    , assertion = badge.data.body;
  
  res.render('badge-details', {
    title: '',
    user: (assertion.recipient === email) ? email : null,
    
    id: badge.data.id,
    recipient: assertion.recipient,
    image: badge.data.image_path,
    owner: (assertion.recipient === email),
    
    deleteRoute: reverse('backpack.deleteBadge', { badgeId: badge.data.body_hash }),
    csrfToken: req.session._csrf,
    
    badge: badge,
    type: assertion.badge,
    meta: {}, // #TODO: remove.
    groups: [] // #TODO: replace with real grouping
  })
}

exports.addBadgeToGroup = function(req, res, next) {
  var badge = req.badge
    , assertion = badge.data.body
    , email = emailFromSession(req);
  if (email !== assertion.recipient) return res.send('forbidden', 403);
  res.send('Not implemented yet', 500);
};

exports.createGroup = function(req, res, next) {
  res.send('Not implemented yet', 500);
};

exports.deleteBadge = function (req, res) {
  var badge = req.badge
    , assertion = badge.data.body
    , email = emailFromSession(req);
  
  if (assertion.recipient !== email) { return res.send("Cannot delete a badge you don't own", 403); }
  
  badge.destroy(function (err, badge) {
    if (err) {
      logger.warn('Failed to delete badge');
      logger.warn(err);
      return res.send('Could not delete badge. This error has been logged', 500);
    }
    return res.redirect(reverse('backpack.manage'), 303);
  })
};

// #TODO: de-complicate this.
exports.upload = function(req, res) {
  var email = emailFromSession(req);
  if (!email) return res.redirect(reverse('backpack.login'), 303);

  var redirect = function(err) {
    if (err) req.flash('error', err);
    return res.redirect(reverse('backpack.manage'), 303);
  }
 
  var filedata, assertionURL;
  filedata = req.files.userBadge;

  if (!filedata) return redirect();

  if (filedata.size > (1024 * 256)) return redirect('Maximum badge size is 256kb! Contact your issuer.');
  
  fs.readFile(filedata.path, function(err, imagedata){
    if (err) return redirect('SNAP! There was a problem reading uploaded badge.');
    try {
      assertionURL = baker.read(imagedata)
    } catch (e) {
      return redirect('Badge is malformed! Contact your issuer.');
    }
    remote.assertion(assertionURL, function(err, assertion) {
      if (err.status !== 'success') {
        logger.warn('failed grabbing assertion for URL '+ assertionURL);
        logger.warn('reason: '+ JSON.stringify(err));
        return redirect('There was a problem validating the badge! Contact your issuer.');
      }
      if (assertion.recipient !== email) {
        return redirect('This badge was not issued to you! Contact your issuer.');
      }
      _award(assertion, assertionURL, imagedata, function(err, badge) {
        if (err) {
          logger.error('could not save badge: ' + err);
          return redirect('There was a problem saving your badge!');
        }
        return redirect();
      });
    })
  });
}

var emailFromSession = function(req) {
  var session, userEmail, emailRe;
  if (!req.session || !req.session.authenticated) return false;
  session = req.session;
  userEmail = session.authenticated[0];
  emailRe = /^.+?\@.+?\.*$/;
  if (!emailRe.test(userEmail)) {
    logger.warn('session.authenticate does not contain valid user: ' + userEmail);
    req.session = {};
    return false;
  }
  return userEmail;
}
