var request = require('request')
  , qs = require('querystring')
  , fs = require('fs')
  , logger = require('../lib/logging').logger
  , url = require('url')
  , configuration = require('../lib/configuration')
  , baker = require('../lib/baker')
  , remote = require('../lib/remote')
  , browserid = require('../lib/browserid')
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

  var ident = configuration.get('identity')
    , uri = ident.protocol + '://' +  ident.server + ident.path
    , assertion = req.body['assertion']
    , audience = configuration.get('hostname');
  
  browserid(uri, assertion, audience, function (err, verifierResponse) {
    if (err) {
      logger.error('Failed browserID verification: ')
      logger.debug('Type: ' + err.type + "; Body: " + err.body);
      req.flash('error', "Could not verify with browserID!");
      return res.redirect('back', 303);
    }
    
    if (!req.session) res.session = {};
    
    if (!req.session.emails) req.session.emails = []
    
    logger.debug('browserid verified, attempting to authenticate user');
    req.session.emails.push(verifierResponse.email);
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
  var userEmail = '',
      emailRe = /^.+?\@.+?\.*$/;
  
  if (!req.session) {
    logger.debug('could not find session');
    return false;
  }
  
  if (!req.session.emails) {
    logger.debug('could not find emails array in session');
    return false;
  }
  
  userEmail = req.session.emails[0];
  
  if (!emailRe.test(userEmail)) {
    logger.warn('req.session.emails does not contain valid user: ' + userEmail);
    req.session = {};
    return false;
  }
  
  return userEmail;
}
