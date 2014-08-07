const request = require('request');
const _ = require('underscore');
const qs = require('querystring');
const fs = require('fs');
const async = require('async');
const url = require('url');
const bakery = require('openbadges-bakery');

const logger = require('../lib/logger');
const configuration = require('../lib/configuration');
const browserid = require('../lib/browserid');
const awardBadge = require('../lib/award');
const analyzeAssertion = require('../lib/analyze-assertion');
const normalizeAssertion = require('../lib/normalize-assertion');
const Badge = require('../models/badge');
const Group = require('../models/group');
const User = require('../models/user');

/**
 * Render the login page.
 */

exports.login = function login(request, response) {
  if (request.user)
    return response.redirect(303, '/');
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

exports.authenticate = function authenticate(req, res) {
  function formatResponse(to, apiError, humanReadableError) {
    const preferJsonOverHtml = req.accepts('html, json') === 'json';
    if (preferJsonOverHtml) {
      if (apiError)
        return res.send(400, {status: 'error', reason: apiError});
      return res.send(200, {status: 'ok', email: req.session.emails[0]});
    }
    if (humanReadableError)
      req.flash('error', humanReadableError);
    return res.redirect(303, to);
  }

  const assertion = req.body && req.body.assertion;
  const verifierUrl = browserid.getVerifierUrl(configuration);
  const audience = browserid.getAudience(req);

  if (!assertion)
    return formatResponse('/backpack/login', "assertion expected");

  browserid.verify({
    url: verifierUrl,
    assertion: assertion,
    audience: audience,
  }, function (err, email) {
    if (err) {
      logger.error('Failed browserID verification: ');
      logger.debug('Code: ' + err.code + "; Extra: " + err.extra);
      return formatResponse('back', "browserID verification failed: " + err.message,
                            "Could not verify with browserID!");
    }

    req.session.emails = [email];
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
  response.redirect(303, '/backpack/login');
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
    return response.send(403, 'Must be logged in');
  if (!adminUsers)
    return response.send('Not implemented.')
  if (adminUsers.indexOf(user.get('email')) < 0)
    return response.send(403, 'Must be an admin user');
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
    return response.redirect(303, '/backpack/login');

  function startResponse () {
    return user.getLatestBadges(function(err, badges) {
      if (err) return next(err);
      try {
        return badgePage(request, response, badges, 'recentBadges.html');
      }
      catch (ex) {
        next(ex);
      }
    });
  }

  return startResponse();
}

exports.allBadges = function everything (request, response, next) {
  var user = request.user;
  if (!user)
    return response.redirect(303, '/backpack/login');

  function startResponse () {
    return user.getAllBadges(function(err, badges) {
      if (err) return next(err);
      try {
        return badgePage(request, response, badges, 'allBadges.html');
      }
      catch (ex) {
        next(ex);
      }
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
    return response.redirect(303, '/backpack/login');

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
    user.getAllBadges(makeResponse);
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
      return response.redirect(303, '/backpack/login');

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

/**
 * Display badge-upload form
 */

exports.addBadge = function addBadge(request, response) {
  var error = request.flash('error');
  var success = request.flash('success');

  response.render('addBadge.html', {
    error: error,
    success: success,
    csrfToken: request.session._csrf
  });
}

/**
 * Handle upload of a badge from a user's filesystem. Gets embedded data from
 * uploaded PNG with `urlFromUpload` from lib/baker, retrieves the assertion
 * using `getHostedAssertion` from lib/remote and finally awards the badge
 * using `award` from lib/award.
 *
 * @param {File} userBadge uploaded badge from user (from request)
 * @return {HTTP 303} redirects to manage (with error, if necessary)
 */


exports.userBadgeUpload = function userBadgeUpload(req, res) {
  function redirect(err) {
    var url = '/'
    if (err) {
      logger.warn('There was an error uploading a badge');
      logger.debug(err);
      req.flash('error', err.message);
      url = '/backpack/add'
    }
    // We use store errors in res._error so we can check them in our
    // controller mock tests. This isn't some magic variable, `_error`
    // is just a convenient property name.
    res._error = err;
    return res.redirect(303, url);
  }

  const user = req.user;
  const tmpfile = req.files.userBadge;
  const awardOptions = {recipient: user.get('email')};

  // While the openbadges assertion specification doesn't specify a size
  // limit, our backpack does. We don't want to store lots of huge images,
  // and badges really shouldn't be larger than 256k so that's what we're
  // imposing here.
  const MAX_IMAGE_SIZE = 1024*256;

  if (!user)
    return res.redirect(303, '/');

  if (!tmpfile.size)
    return redirect(new Error('You must choose a badge to upload.'));

  if (tmpfile.size > MAX_IMAGE_SIZE)
    return redirect(new Error('Maximum badge size is ' + MAX_IMAGE_SIZE / 1024 + 'KB'));

  function getUrlOrSignature(string) {
    string = string.trim()
    try {
      // let's assume it's an assertion to begin with
      return {
        type: 'url',
        value: JSON.parse(string).verify.url
      }
    } catch (e) {
      // if it's not a json string, we naïvely assume
      // it's either a url or a signature.
      if (string.indexOf('http') === 0) {
        return {
          type: 'url',
          value: string,
        }
      }

      return {
        type: 'signature',
        value: string,
      }
    }
  }

  async.waterfall([
    function getBadgeImageData(callback) {
      fs.readFile(tmpfile.path, callback);
    },
    function extractAssertionUrl(imageData, callback) {
      awardOptions.imagedata = imageData;
      bakery.extract(imageData, callback);
    },
    function getAssertionData(url, callback) {
      const data = getUrlOrSignature(url)
      awardOptions[data.type] = data.value;
      analyzeAssertion(data.value, callback);
    },
    function confirmAndAward(data, callback) {
      const recipient = awardOptions.recipient;
      const assertion = normalizeAssertion(data.info);
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
