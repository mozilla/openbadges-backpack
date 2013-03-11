const _ = require('underscore');
const request = require('request');
const fs = require('fs');
const url = require('url');
const validator = require('openbadges-validator');
const logger = require('../lib/logging').logger;
const awardBadge = require('../lib/award');
const Badge = require('../models/badge.js');
const regex = require('../lib/regex.js');
const analyzeAssertion = require('../lib/analyze-assertion');
const normalizeAssertion = require('../lib/normalize-assertion');

/**
 * Fully qualify a url.
 *
 * @param {String} pathOrUrl either a path like /what.html or a full url
 * @param {String} origin a full quallified url
 * @return {String} a fully qualified url, using parts from the origin if
 *   the original `pathOrUrl` was just a path.
 */
function qualifyUrl(pathOrUrl, origin) {
  var parts = url.parse(pathOrUrl);
  if (!parts.hostname) {
    var originParts = url.parse(origin);
    parts.host = originParts.host;
    parts.port = originParts.port;
    parts.slashes = originParts.slashes;
    parts.protocol = originParts.protocol;
    parts.hostname = originParts.hostname;
  }
  return url.format(parts);
}


function validUrl(url) {
  if (regex.url.test(url))
    return true;
  // Occasionally we get requests where the URL is double-encoded, so it
  // remains encoded even after express does one pass of decoding. To
  // handle those cases we try one more pass of decoding before giving
  // up and rejecting the URL.
  if (regex.url.test(decodeURIComponent(url)))
    return true;
  return false;
}

var myFiles = [
  "issuer-parts/issuer-script-intro.js",
  "jquery.min.js",
  "jschannel.js",
  "issuer-parts/issuer-core.js",
  "issuer-parts/issuer-backpack-connect.js",
  "issuer-parts/issuer-script-outro.js"
];

myFiles = myFiles.map(function (filename) {
  return __dirname + '/../static/js/' + filename;
});

function concatenate(files, cb) {
  var completed = 0;
  var contents = [];

  function startLoading(i) {
    fs.readFile(files[i], function (err, data) {
      if (err) {
        cb(err);
        return;
      }
      contents[i] = data;
      completed++;
      if (completed == files.length)
        cb(null, contents.join('\n'));
    });
  }

  for (var i = 0; i < files.length; i++)
    startLoading(i);
}

if (module.parent === null) {
  concatenate(myFiles, function (err, data) {
    var filename = 'issuer.js';
    if (err)
      throw err;
    fs.writeFileSync(filename, data);
    console.log('wrote', filename, '(' + data.length, 'bytes)');
  });
}

exports.generateScript = function (req, res) {
  concatenate(myFiles, function (err, data) {
    if (err) {
      res.send(500);
      throw err;
    } else {
      res.header('Content-Type', 'application/javascript');
      res.send(data);
    }
  });
};

exports.frame = function (req, res) {
  res.header('Cache-Control', 'no-cache, must-revalidate');
  res.render('badge-accept.html', {
    layout: null,
    framed: true,
    csrfToken: req.session._csrf,
    email: req.session.emails && req.session.emails[0]
  });
};

function isValidInput(input) {
  return validUrl(input) || validator.isSignedBadge(input)
}
exports.frameless = function (req, res) {
  var assertions = req.body.assertions || [];
  assertions = (typeof assertions === 'string')
    ? [assertions]
    : assertions;
  for (var i = 0, assertion; assertion = assertions[i]; i++) {
    if (!isValidInput(assertion)) {
      logger.error("malformed assertion " + assertion + " returning 400");
      return res.send('assertion must be url or signature', 400);
    }
  }
  res.header('Cache-Control', 'no-cache, must-revalidate');
  res.render('badge-accept.html', {
    layout: null,
    framed: false,
    assertions: JSON.stringify(assertions),
    csrfToken: req.session._csrf,
    email: req.session.emails && req.session.emails[0]
  });
};

exports.issuerBadgeAddFromAssertion = function (req, res, next) {
  /* the issuer api, flawed in that it needs to query to badge assertion
   * so that we're not making a double request to the issuer, once for the GET
   * confirming the badge, and once for the POST awarding the badge. Not
   * sure what caching options we have currently, so just going ahead and
   * making a double request.
   *
   * request can either be a GET or a POST, one required param 'assertion'
   * which is either a url pointing to a badge assertion or a signed assertion
   *
   */

  logger.debug("here's my full url " + req.originalUrl);
  const user = req.user;
  const error = req.flash('error');
  const success = req.flash('success');

  // is the user logged in? if not, suggest they redirect to the login page
  if (!user) return res.json({
    message: "user is not logged in, redirect to /backpack/login",
    redirect_to: '/backpack/login'
  }, 403);

  const input = req.query.assertion || req.body.assertion || req.body.badge;
  const assertionIsSignature = validator.isSignedBadge(input);
  const assertionIsUrl = validUrl(input);

  // no assertion was passed, return error
  if (!input) {
    logger.error("didn't receive an assertion returning 400");
    return res.json({
      message: 'must provide either url or signature'
    }, 400);
  }

  if (!assertionIsUrl && !assertionIsSignature) {
    logger.error("malformed assertion " + input + " returning 400");
    return res.json({
      message: 'malformed assertion, must be a url or signature'
    }, 400);
  }

  analyzeAssertion(input, function (err, data) {
    if (err) {
      logger.debug('there was an error analyzing the assertion');
      console.dir(err);

      if (err.code === 'resources')
        err.message = 'Could not get all linked resources';
      if (err.code === 'structure')
        err.message = 'Invalid assertion structure';
      if (err.code === 'parse')
        err.message = 'Could not parse the '+err.field+' file at '+err.url+' file';
      if (err.code === 'http-status')
        err.message = 'Tried to get '+err.field+' file at '+err.url+' and got an HTTP '+err.received;
      return res.json(err, 400);
    }

    const assertion = normalizeAssertion(data);
    const recipient = user.get('email');
    const userOwnsBadge = Badge.confirmRecipient(assertion, recipient);
    const origin = assertion.badge.issuer.origin;

    if (req.method == 'POST' &&  !userOwnsBadge) {
      return res.json({
        message: "badge assertion is for a different user"
      }, 403);
    }

    if (req.backpackConnect &&
        req.backpackConnect.get('origin') != origin)
      return res.json({
        message: "issuer origin must be identical to bearer token origin"
      }, 400);

    // awarding the badge, only done if this is a POST
    if (req.method == 'POST') {
      const imagedata = data.resources['badge.image'];
      const opts = {
        assertion: assertion,
        imagedata: imagedata,
        recipient: recipient,
        url: assertionIsUrl ? input : null,
        signature: assertionIsSignature ? input: null,
      };
      return awardBadge(opts, function (err, badge) {
        if (err) {
          const errorMessage = "badge error " + input + err;
          logger.error(errorMessage);
          // check if this badge is a duplicate, currently in the
          // error message
          logger.error(err);
          const dupeRegex = /Duplicate entry/;
          if (dupeRegex.test(err)) {
            return res.json({
              badge: assertion,
              exists: true,
              message: "badge already exists"
            }, 304);
          }
          // return a general error message
          return res.json({
            badge: assertion,
            exists: false,
            message: errorMessage
          }, 500);
        }
        logger.debug("badge added " + input);
        return res.json({
          exists: false,
          badge: assertion
        }, 201);
      });
    }

    // if this is a GET, we still need to return the badge

    // we want to be able to display the badge in the issuer
    // workflow, so we need to make sure the image url is absolute
    const rawImageUrl = assertion.badge.image
    const absoluteImageUrl = qualifyUrl(rawImageUrl, origin);
    assertion.badge.image = absoluteImageUrl;

    const response = {
      exists: false,
      badge: assertion,
      recipient: recipient
    };
    const conditions = {};
    if (assertionIsUrl)
      conditions.endpoint = input;
    if (assertionIsSignature)
      conditions.signature = input;
    Badge.findOne(conditions, function (err, badge) {
      if (err) {
        logger.error(err);
        return res.json({message: "internal server error"}, 500);
      }

      if (badge && badge.get("user_id") == req.user.get("id"))
        response.exists = true;

      if (Badge.confirmRecipient(assertion, req.user.get('email')))
        response.owner = true;

      return res.json(response, 200);
    });
  });
};

exports.welcome = function(request, response, next) {
  var user = request.user;
  if (!user) return response.redirect('/backpack/login', 303);

  function makeResponse(err, badges) {
    if (err) return next(err);
    if (badges && badges.length)
      return response.redirect('/', 303);
    else
      return response.render('issuer-welcome.html');
  }

  Badge.find({email: user.get('email')}, makeResponse);
};
