const request = require('request');
const _ = require('underscore');
const qs = require('querystring');
const fs = require('fs');
const async = require('async');
const url = require('url');
const bakery = require('openbadges-bakery');

const logger = require('../lib/logging').logger;
const configuration = require('../lib/configuration');
const browserid = require('../lib/browserid');
const awardBadge = require('../lib/award');
const analyzeAssertion = require('../lib/analyze-assertion');
const Badge = require('../models/badge');
const Group = require('../models/group');
const User = require('../models/user');

/**
 * Render the login page.
 */

exports.login = function login(request, response) {
  // request.flash returns an array. Pass on the whole thing to the view and
  // decide there if we want to display all of them or just the first one.
  response.render('login.html', {
    error: request.flash('error'),
    csrfToken: request.session._csrf
  });
};

/**
 * Authenticate the user using a browserID assertion.
 *
 * @param {String} assertion returned by browserID login
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
    return formatResponse('/backpack/login', "assertion expected");
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
    return formatResponse('/');
  });
};


/**
 * Wipe the user's session and send back to the login page.
 *
 * @return {HTTP 303} redirect user to login page
 */

exports.signout = function signout(request, response) {
  request.session = {};
  response.redirect('/backpack/login', 303);
};

/**
 * Some statistics on the backpack...aggregated across all
 * individual backpacks
 */

exports.stats = function stats(request, response, next) {
  var user = request.user;
  var adminUsers = configuration.get('admins');

  // access control: foremost we need a logged in user. next we ensure
  // `admins` is defined in the environment config and once we have that
  // we make sure the current user is in that list. for posterity, we
  // log everytime a user accesses the stats page.
  if (!user)
    return response.send('Must be logged in', 403);
  if (!adminUsers)
    return response.send('Not implemented.')
  if (adminUsers.indexOf(user.get('email')) < 0)
    return response.send('Must be an admin user', 403);
  logger.info(user.get('email') + ' is accessing /stats');

  async.parallel({
    badges: Badge.stats,
    users: User.totalCount
  }, function(err, results) {
    if (err) {
      console.error(err);
      console.log(results);
      return next(err);
    }
    return response.render('stats.html', {
      totalBadges: results.badges.totalBadges,
      totalPerIssuer: results.badges.totalPerIssuer,
      userCount: results.users
    })
  });
}

function badgePage (request, response, badges, template) {
  var user = request.user;
  var error = request.flash('error');
  var success = request.flash('success');

  badges.forEach(function (badge) {
    var body = badge.get('body');
    var origin = body.badge.issuer.origin;
    var criteria = body.badge.criteria;
    var evidence = body.evidence;

    if (criteria[0] === '/') body.badge.criteria = origin + criteria;
    if (evidence && evidence[0] === '/') body.evidence = origin + evidence;
    // Nobody wants to see the hash in the UI, apparently.
    if (body.recipient.match(/\w+(\d+)?\$.+/)) body.recipient = user.get('email');

    badge.serializedAttributes = JSON.stringify(badge.attributes);
  });

  response.render(template||'badges.html', {
    error: error,
    success: success,
    badges: badges,
    csrfToken: request.session._csrf
  });
}

exports.recentBadges = function recent (request, response, next) {
  var user = request.user;
  if (!user)
    return response.redirect('/backpack/login', 303);

  function startResponse () {
    return user.getLatestBadges(function(err, badges) {
      if (err) return next(err);
      return badgePage(request, response, badges, 'recentBadges.html');
    });
  }

  return startResponse();
}

exports.allBadges = function everything (request, response, next) {
  var user = request.user;
  if (!user)
    return response.redirect('/backpack/login', 303);

  function startResponse () {
    return user.getAllBadges(function(err, badges) {
      if (err) return next(err);
      return badgePage(request, response, badges, 'allBadges.html');
    });
  }

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
  if (!user)
    return response.redirect('/backpack/login', 303);

  response.header('Cache-Control', 'no-cache, must-revalidate');

  function prepareBadgeIndex(badges) {
    badges.forEach(function (badge) {
      var body = badge.get('body');
      var origin = body.badge.issuer.origin;
      var criteria = body.badge.criteria;
      var evidence = body.evidence;

      if (criteria[0] === '/') body.badge.criteria = origin + criteria;
      if (evidence && evidence[0] === '/') body.evidence = origin + evidence;
      // Nobody wants to see the hash in the UI, apparently.
      if (body.recipient.match(/\w+(\d+)?\$.+/)) body.recipient = user.get('email');

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
    response.render('backpack.html', {
      error: error,
      success: success,
      badges: badges,
      csrfToken: request.session._csrf,
      groups: groups
    });
  }

  var startResponse = getGroups;
  return startResponse();
};


/**
 * Render the settings page for logged in users.
 *
 * @return {HTTP 303} redirect user to login page
 */

exports.settings = function(options) {
  options = options || {};

  var bpcModel = options.backpackConnectModel ||
                 require("../models/backpack-connect").Session;
  var getServices = options.getServices || function() {
      /* This needs to be plugged in to something */

      // return {
      //   twitter: false,
      //   facebook: {auto: true}
      // };

      return {};
  };

  return function settings(request, response, next) {
    var user = request.user;
    var error = request.flash('error');
    var success = request.flash('success');

    if (!user)
      return response.redirect('/backpack/login', 303);

    response.header('Cache-Control', 'no-cache, must-revalidate');

    bpcModel.summarizeForUser(user.get('id'), function(err, issuers) {
      if (err) {
        logger.warn("There was an error summarizing backpack connect info");
        logger.debug(err);
        return next(err);
      }

      issuers.forEach(function(issuer) {
        issuer.domain = url.parse(issuer.origin).hostname;
      });

      response.render('settings.html', {
        error: error,
        success: success,
        csrfToken: request.session._csrf,
        services: getServices(),
        issuers: issuers
      });
    });
  };
};

exports.userBadgeUpload = function userBadgeUpload(req, res) {
  // go back to the manage page and potentially show an error
  function redirect(err) {
    if (err) {
      logger.warn('There was an error uploading a badge');
      logger.debug(err);
      req.flash('error', err.message);
    }
    res._error = err;
    return res.redirect('/', 303);
  }

  const user = req.user;
  const tmpfile = req.files.userBadge;
  const awardOptions = {recipient: user.get('email')};

  if (!user) {
    res._error = new Error('no user');
    return res.redirect('/', 303);
  }

  if (!tmpfile.size)
    return redirect(new Error('You must choose a badge to upload.'));

  if (tmpfile.size > 1024*256)
    return redirect(new Error('Maximum badge size is 256kb'));

  async.waterfall([
    function getBadgeImageData(callback) {
      fs.readFile(tmpfile.path, callback);
    },
    function extractAssertionUrl(imageData, callback) {
      awardOptions.imagedata = imageData;
      bakery.extract(imageData, callback);
    },
    function getAssertionData(url, callback) {
      awardOptions.url = url;
      analyzeAssertion(url, callback);
    },
    function confirmAndAward(info, callback) {
      const recipient = awardOptions.recipient;
      const assertion = info.structures.assertion;
      const userOwnsBadge = Badge.confirmRecipient(assertion, recipient);
      if (!userOwnsBadge) {
        const err = new Error('This badge was not issued to you! Contact your issuer.');
        err.name = 'InvalidRecipient';
        res._error = err;
        return callback(err);
      }
      awardOptions.assertion = assertion;
      awardBadge(awardOptions, callback);
    }

  ], redirect);
};

/**
 * Stub methods to prevent crash in Express 3.0.5
 */

exports.details = function details (request, response) {
  return;
}

exports.deleteBadge = function deleteBadge (request, response) {
  return;
}
