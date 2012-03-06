var request = require('request')
  , _ = require('underscore')
  , qs = require('querystring')
  , fs = require('fs')
  , logger = require('../lib/logging').logger
  , url = require('url')
  , configuration = require('../lib/configuration')
  , baker = require('../lib/baker')
  , remote = require('../lib/remote')
  , browserid = require('../lib/browserid')
  , awardBadge = require('../lib/award')
  , reverse = require('../lib/router').reverse
  , Badge = require('../models/badge')
  , Group = require('../models/group')

/**
 * Render the login page.
 */

exports.login = function(req, res) {
  // req.flash returns an array. Pass on the whole thing to the view and
  // decide there if we want to display all of them or just the first one.
  res.render('login', {
    error: req.flash('error'),
    csrfToken: req.session._csrf
  });
};

/**
 * Authenticate the user using a browserID assertion.
 *
 * @param {String} assertion returned by `navigator.id.getVerifiedEmail`
 * @return {HTTP 303}
 *   on error: redirect one page back
 *   on success: redirect to `backpack.manage`
 */

exports.authenticate = function(req, res) {
  function response(to, apiError, humanReadableError) {
    if (jsonResponse) {
      if (apiError)
        return res.send({status: 'error', reason: apiError}, 400);
      else
        return res.send({status: 'ok', email: req.session.emails[0]});
    } else {
      if (humanReadableError)
        req.flash('error', humanReadableError);
      return res.redirect(to, 303);
    }
  }

  var jsonResponse = req.headers['accept'] &&
                     req.headers['accept'].indexOf('application/json') != -1;

  if (!req.body || !req.body['assertion']) {
    return response(reverse('backpack.login'), "assertion expected");
  }

  var ident = configuration.get('identity')
    , uri = ident.protocol + '://' +  ident.server + ident.path
    , assertion = req.body['assertion']
    , audience = configuration.get('hostname');
  
  browserid.verify(uri, assertion, audience, function (err, verifierResponse) {
    if (err) {
      logger.error('Failed browserID verification: ')
      logger.debug('Type: ' + err.type + "; Body: " + err.body);
      return response('back', "browserID verification failed: " + err.type,
                      "Could not verify with browserID!");
    }
    
    if (!req.session.emails) req.session.emails = []
    
    logger.debug('browserid verified, attempting to authenticate user');
    req.session.emails.push(verifierResponse.email);
    return response(reverse('backpack.manage'));
  });
};


/**
 * Wipe the user's session and send back to the login page.
 *
 * @return {HTTP 303} redirect user to login page
 */

exports.signout = function(req, res) {
  req.session = {};
  res.redirect(reverse('backpack.login'), 303);
};


/**
 * Render the management page for logged in users.
 *
 * @return {HTTP 303} redirect user to login page
 */

exports.manage = function(req, res, next) {
  var user = req.user
    , error = req.flash('error')
    , success = req.flash('success')
    , groups = []
    , badgeIndex = {};
  if (!user) return res.redirect(reverse('backpack.login'), 303);
  
  res.header('Cache-Control', 'no-cache, must-revalidate');
  
  var prepareBadgeIndex = function (badges) {
    badges.forEach(function (badge) {
      var body = badge.get('body')
        , origin = body.badge.issuer.origin
        , criteria = body.badge.criteria
        , evidence = body.evidence;
      if (criteria[0] === '/') body.badge.criteria = origin + criteria;
      if (evidence && evidence[0] === '/') body.evidence = origin + evidence;
      
      badgeIndex[badge.get('id')] = badge;
      badge.serializedAttributes = JSON.stringify(badge.attributes);
    });
    
  };
  
  var getGroups = function () {
    Group.find({user_id: user.get('id')}, getBadges);
  };
  
  var getBadges = function (err, results) {
    if (err) return next(err);
    groups = results;
    Badge.find({email: user.get('email')}, makeResponse)
  };
  
  var modifyGroups = function (groups) {
    groups.forEach(function (group) {
      var badgeObjects = []
        , badgeIds = group.get('badges');
      
      function badgeFromIndex (id) { return badgeIndex[id]; }
      
      // copy URL from attributes to main namespace.
      group.url = group.get('url');
      
      // fail early if there aren't any badges associated with this group
      if (!group.get('badges')) return;
      
      // strip out all of the ids which aren't in the index of user owned badges
      badgeIds = _.filter(badgeIds, badgeFromIndex);
      
      // get badge objects from the list of remaining good ids
      badgeObjects = badgeIds.map(badgeFromIndex);
    
      
      group.set('badges', badgeIds);
      group.set('badgeObjects', badgeObjects);
    });
  };
  
  var makeResponse = function (err, badges) {
    if (err) return next(err);
    prepareBadgeIndex(badges);
    modifyGroups(groups);
    res.render('backpack', {
      error: error,
      success: success,
      badges: badges,
      csrfToken: req.session._csrf,
      groups: groups,
      tooltips: req.param('tooltips')
    })
  };
  
  var startResponse = getGroups;
  return startResponse();
};


/**
 * Handle upload of a badge from a user's filesystem. Gets embedded data from
 * uploaded PNG with `urlFromUpload` from lib/baker, retrieves the assertion
 * using `getHostedAssertion` from lib/remote and finally awards the badge
 * using `award` from lib/award.
 *
 * @param {File} userBadge uploaded badge from user (from request)
 * @return {HTTP 303} redirects to manage (with error, if necessary)
 */

exports.userBadgeUpload = function(req, res) {
  var user = req.user
    , tmpfile = req.files.userBadge;
  
  // go back to the manage page and potentially show an error
  var redirect = function(err) {
    if (err) {
      logger.warn('There was an error uploading a badge');
      logger.debug(err);
      req.flash('error', err.message);
    }
    return res.redirect(reverse('backpack.manage'), 303);
  }
  
  if (!user) return res.redirect(reverse('backpack.login'), 303);
  
  if (!tmpfile.size) return redirect(new Error('You must choose a badge to upload.'));
  
  // get the url from the uploaded badge file
  baker.urlFromUpload(tmpfile, function (err, assertionUrl, imagedata) {
    if (err) return redirect(err);
    
    // grab the assertion data from the endpoint
    remote.getHostedAssertion(assertionUrl, function (err, assertion) {
      if (err) return redirect(err);

      // bail if the badge wasn't issued to the logged in user
      if (assertion.recipient !== user.get('email')) {
        err = new Error('This badge was not issued to you! Contact your issuer.');
        err.name = 'InvalidRecipient';
        return redirect(err);
      }
      
      // try to issue the badge 
      awardBadge(assertion, assertionUrl, imagedata, function(err, badge) {
        if (err) {
          logger.warn('Could not save an uploaded badge: ');
          logger.debug(err);
          return redirect(new Error('There was a problem saving your badge!'));
        }
        return redirect();
      });
    });
  });
};
