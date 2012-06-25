var request = require('request');
var _ = require('underscore');
var qs = require('querystring');
var fs = require('fs');
var logger = require('../lib/logging').logger;
var url = require('url');
var configuration = require('../lib/configuration');
var baker = require('../lib/baker');
var remote = require('../lib/remote');
var browserid = require('../lib/browserid');
var awardBadge = require('../lib/award');
var reverse = require('../lib/router').reverse;
var Badge = require('../models/badge');
var Group = require('../models/group');

/**
 * Render the login page.
 */

exports.login = function login(request, response) {
  // request.flash returns an array. Pass on the whole thing to the view and
  // decide there if we want to display all of them or just the first one.
  response.render('login', {
    error: request.flash('error'),
    csrfToken: request.session._csrf
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

exports.authenticate = function authenticate(request, response) {
  function formatResponse(to, apiError, humanReadableError) {
    if (jsonResponse) {
      if (apiError)
        return response.send({status: 'error', reason: apiError}, 400);
      else
        return response.send({status: 'ok', email: request.session.emails[0]});
    } else {
      if (humanReadableError)
        request.flash('error', humanReadableError);
      return response.redirect(to, 303);
    }
  }

  var jsonResponse = request.headers['accept'] &&
                     request.headers['accept'].indexOf('application/json') != -1;

  if (!request.body || !request.body['assertion']) {
    return formatResponse(reverse('backpack.login'), "assertion expected");
  }

  var ident = configuration.get('identity');
  var uri = ident.protocol + '://' +  ident.server + ident.path;
  var assertion = request.body['assertion'];
  var audience = configuration.get('hostname');

  browserid.verify(uri, assertion, audience, function (err, verifierResponse) {
    if (err) {
      logger.error('Failed browserID verification: ');
      logger.debug('Type: ' + err.type + "; Body: " + err.body);
      return formatResponse('back', "browserID verification failed: " + err.type,
                            "Could not verify with browserID!");
    }

    if (!request.session.emails) request.session.emails = [];

    logger.debug('browserid verified, attempting to authenticate user');
    request.session.emails = [verifierResponse.email];
    return formatResponse(reverse('backpack.manage'));
  });
};


/**
 * Wipe the user's session and send back to the login page.
 *
 * @return {HTTP 303} redirect user to login page
 */

exports.signout = function signout(request, response) {
  request.session = {};
  response.redirect(reverse('backpack.login'), 303);
};

/**
 * Some statistics on the backpack...aggregated across all 
 * individual backpacks
 */

exports.stats = function stats(request, response, next) {

  function computeStats(badges) {
    var total_badges = badges.length;
    var total_per_issuer = {};

    _.each(badges, function(b) {
      issuer_name = b.attributes.body.badge.issuer.name || 'No Issuer Name';
      if (_.has(total_per_issuer, issuer_name)) {
        total_per_issuer[issuer_name] = total_per_issuer[issuer_name] + 1;
      } else {
        total_per_issuer[issuer_name] = 1;
      }
    });    
    
    // transform the total_per_issuer object into a nicer array for display
    var nice_total_per_issuer = _.map(total_per_issuer, function(v,k) {
      return {'name':k, 'total':v};
    });

    return {
      'total_badges':total_badges,
      'total_per_issuer': nice_total_per_issuer
    }
  }

  function getBadges() {
    Badge.findAll(makeResponse);
  }

  function makeResponse(err, badges) {
    if (err) return next(err);
    data = computeStats(badges);
    response.render('stats', {
      stats: data,
    });
  }

  var startResponse = getBadges;
  return startResponse();
  
}


/**
 * Render the management page for logged in users.
 *
 * @return {HTTP 303} redirect user to login page
 */

exports.manage = function manage(request, response, next) {
  var user = request.user;
  var error = request.flash('error');
  var success = request.flash('success');
  var groups = [];
  var badgeIndex = {};
  if (!user) return response.redirect(reverse('backpack.login'), 303);

  response.header('Cache-Control', 'no-cache, must-revalidate');

  function prepareBadgeIndex(badges) {
    badges.forEach(function (badge) {
      var body = badge.get('body');
      var origin = body.badge.issuer.origin;
      var criteria = body.badge.criteria;
      var evidence = body.evidence;

      if (criteria[0] === '/') body.badge.criteria = origin + criteria;
      if (evidence && evidence[0] === '/') body.evidence = origin + evidence;

      badgeIndex[badge.get('id')] = badge;
      badge.serializedAttributes = JSON.stringify(badge.attributes);
    });
  }

  function getGroups() {
    Group.find({user_id: user.get('id')}, getBadges);
  }

  function getBadges(err, results) {
    if (err) return next(err);
    groups = results;
    Badge.find({email: user.get('email')}, makeResponse);
  }

  function modifyGroups(groups) {
    groups.forEach(function (group) {
      var badgeObjects = [];
      var badgeIds = group.get('badges');

      function badgeFromIndex(id) { return badgeIndex[id] }

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
  }

  function makeResponse(err, badges) {
    if (err) return next(err);
    prepareBadgeIndex(badges);
    modifyGroups(groups);
    response.render('backpack', {
      error: error,
      success: success,
      badges: badges,
      csrfToken: request.session._csrf,
      groups: groups,
      tooltips: request.param('tooltips')
    });
  }

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


exports.userBadgeUpload = function userBadgeUpload(request, response) {
  var user = request.user;
  var tmpfile = request.files.userBadge;

  // go back to the manage page and potentially show an error
  function redirect(err) {
    if (err) {
      logger.warn('There was an error uploading a badge');
      logger.debug(err);
      request.flash('error', err.message);
    }
    return response.redirect(reverse('backpack.manage'), 303);
  }

  if (!user)
    return response.redirect(reverse('backpack.login'), 303);

  if (!tmpfile.size)
    return redirect(new Error('You must choose a badge to upload.'));

  // get the url from the uploaded badge file
  baker.urlFromUpload(tmpfile, function (err, assertionUrl, imagedata) {
    var recipient = user.get('email');
    if (err) return redirect(err);

    // grab the assertion data from the endpoint
    remote.getHostedAssertion(assertionUrl, function (err, assertion) {
      if (err) return redirect(err);

      var userOwnsBadge = Badge.confirmRecipient(assertion, recipient);
      // bail if the badge wasn't issued to the logged in user
      if (!userOwnsBadge) {
        err = new Error('This badge was not issued to you! Contact your issuer.');
        err.name = 'InvalidRecipient';
        return redirect(err);
      }

      // try to issue the badge
      var opts = {
        assertion: assertion,
        url: assertionUrl,
        imagedata: imagedata,
        recipient: recipient
      };

      awardBadge(opts, function (err, badge) {
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
