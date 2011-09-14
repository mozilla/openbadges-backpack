var request = require('request')
  , qs = require('querystring')
  , fs = require('fs')
  , logger = require('../lib/logging').logger
  , configuration = require('../lib/configuration')
  , baker = require('../lib/baker')
  , remote = require('../lib/remote')
  , _award = require('../lib/award')
  , reverse = require('../lib/router').reverse
  , Badge = require('../models/badge')

exports.param = {}
exports.param['badgeId'] = function(req, res, next, id) {
  Badge.findById(id, function(err, doc) {
    if (!doc) return res.send('could not find badge', 404);
    req.badge = doc;
    return next();
  })
}

exports.login = function(req, res) {
  // req.flash returns an array. Pass on the whole thing to the view and
  // decide there if we want to display all of them or just the first one.
  res.render('login', {
    error: req.flash('error')
  });
};

exports.authenticate = function(req, res) {
  // If `assertion` wasn't posted in, the user has no business here.
  // We could return 403 or redirect to login page. It's more polite
  // to just redirect to the login page.
  if (!req.body['assertion']) {
    return res.redirect(reverse('backpack.login'), 303);
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
    return res.redirect(reverse('backpack.manage'), 303);
  })
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
  if (!req.user) return res.redirect(reverse('backpack.login'), 303);
  var userEmail = req.user.email
    , error = req.flash('error')
    , success = req.flash('success')
  Badge.organize(userEmail, function(err, badges){
    if (err) next(err)
    res.render('manage', {
      error: error,
      success: success,
      user: userEmail,
      badges: badges
    });
  })
};

exports.details = function(req, res, next) {
  var userEmail = (req.user || {}).email
    , badge = req.badge
  var fields = {
    title: '',
    user: (badge.recipient === userEmail) ? userEmail : null,
    
    id: badge.id,
    recipient: badge.recipient,
    image: badge.meta.imagePath,
    owner: (badge.recipient === userEmail),
    
    badge: badge,
    type: badge.badge,
    meta: badge.meta
  }
  if (fields.owner) {
    return Badge.userGroups(email, function(err, groups){
      fields.groups = Object.keys(groups);
      res.render('badge-details', fields)
    })
  }
  res.render('badge-details', fields)
}

// #TODO: make sure user owns badge
exports.apiAccept = function(req, res) {
  var badge = req.badge
  badge.meta.accepted = true;
  badge.meta.rejected = false;
  badge.save(function(err, badge){
    if (err) req.flash('error', err);
    return res.redirect(reverse('backpack.manage'), 303);
  })  
}

// #TODO: make sure user owns badge
exports.apiGroups = function(req, res) {
  var badge = req.badge
  badge.meta.groups = Object.keys(req.body['group']||{})
  if (req.body['newGroup']) badge.group(req.body['newGroup'])
  badge.save(function(err, badge){
    if (err) req.flash('error', err);
    else req.flash('success', 'Updated badge groups!');
    return res.redirect(reverse('backpack.manage'), 303);
  });
}

// #TODO: make sure user owns badge
exports.apiReject = function(req, res) {
  var badge = req.badge
  badge.meta.accepted = false;
  badge.meta.rejected = true;
  badge.save(function(err, badge){
    if (err) next(err)
    return res.redirect(reverse('backpack.manage'), 303);
  })
}

exports.upload = function(req, res) {
  if (!req.user) return res.redirect(reverse('backpack.login'), 303);
  var user = req.user.email;

  var redirect = function(err) {
    if (err) req.flash('error', err);
    return res.redirect(reverse('backpack.manage'), 303);
  }
  
  req.form.complete(function(err, fields, files) {
    var filedata, assertionURL;
    if (err) {
      logger.warn(err);
      return redirect('SNAP! There was a problem uploading your badge.');
    }
    filedata = files['userBadge'];
    if (!filedata) return redirect();
    if (filedata.size > (1024 * 256)) return redirect('Maximum badge size is 256kb! Contact your issuer.');
    
    fs.readFile(filedata['path'], function(err, imagedata){
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
        if (assertion.recipient !== user) {
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
    })
  });
}