var _ = require('underscore');
var request = require('request');
var fs = require('fs');
var url = require('url');
var logger = require('../lib/logging').logger;
var reverse = require('../lib/router').reverse;
var awardBadge = require('../lib/award');
var remote = require('../lib/remote');
var Badge = require('../models/badge.js');
var regex = require('../lib/regex.js');

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
  //check if the assertion url is malformed
  if (!regex.url.test(url)) {
    // try one pass of decoding
    logger.debug('url did not pass, trying to decodeURIComponent');
    url = decodeURIComponent(url);
    if (!regex.url.test(url)) {
      return false;
    }
  }
  return true;
}

var myFiles = [
  "issuer-parts/issuer-script-intro.js",
  "jquery.min.js",
  "jschannel.js",
  "issuer-parts/issuer-core.js",
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
  res.render('badge-accept', {
    layout: null,
    framed: true,
    csrfToken: req.session._csrf,
    email: req.session.emails && req.session.emails[0]
  });
};

exports.frameless = function (req, res) {
  var assertionUrls = req.body.assertions || [];
  assertionUrls = typeof assertionUrls === 'string' ? [assertionUrls] : assertionUrls;
  for (var i = 0; i < assertionUrls.length; i++) {
    var url = assertionUrls[i];
    if (!validUrl(url)) {
      logger.error("malformed url " + url + " returning 400");
      return res.send('malformed url', 400);
    }
  }
  res.header('Cache-Control', 'no-cache, must-revalidate');
  res.render('badge-accept', {
    layout: null,
    framed: false,
    assertions: JSON.stringify(assertionUrls),
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
   * request can either be a GET or a POST, one required param 'url'
   * which points to a badge assertion.
   *
   */

  logger.debug("here's my full url " + req.originalUrl);
  var user = req.user;
  var error = req.flash('error');
  var success = req.flash('success');

  // is the user logged in? if not, suggest they redirect to the login page
  if (!user) return res.json({ message: "user is not logged in, redirect to " + reverse('backpack.login'),
                               redirect_to: reverse('backpack.login') }, 403);

  // get the url param (lots of debugging statements here)
  var assertionUrl = req.query.url; // if it was as a query param in the GET
  if (!assertionUrl) {
    logger.debug("I'm doing a " + req.method);
    logger.debug("tried GET assertionUrl, didn't get anything " + req.param());
    logger.debug("full query " + JSON.stringify(req.query));
    // if the param was in a POST body
    assertionUrl = req.body['url'];
    logger.debug("POST attempt got " + assertionUrl);
    // more debugging
    if (!assertionUrl && req.method == 'GET') {
      logger.debug("GET is erroring this was the original url " + req.originalUrl);
      logger.debug(JSON.stringify(req.body));
    }
  }

  // no assertionUrl was passed, return error
  if (!assertionUrl) {
    logger.error("didn't receive an assertionUrl returning 400");
    return res.json({message: 'url is a required param'}, 400);
  }

  if (!validUrl(assertionUrl)) {
    logger.error("malformed url " + assertionUrl + " returning 400");
    return res.json({ message: 'malformed url' }, 400);
  }

  /* grabbing the remote assertion, 3 nested steps -
   *
   * 1) grab the remote assertion
   * 2) grab the remote badge image
   * if the request is a POST
   * 3) award the badge
   */
  remote.getHostedAssertion(assertionUrl, function (err, assertion) {
    var recipient = user.get('email');
    if (err || !assertion) {
      var error_msg = "trying to grab url " + assertionUrl + " got error " + err;
      logger.error(error_msg);
      return res.json({ message: error_msg }, 502);
    }

    var userOwnsBadge = Badge.confirmRecipient(assertion, recipient);
    if (req.method == 'POST' &&  !userOwnsBadge) {
      return res.json({ message: "badge assertion is for a different user" }, 403);
    }

    // #TODO: write tests for invalid assertions, potentially move this check
    //   into remote.getHostedAssertion?
    // Badge.validateBody is ill named -- it returns null if the badge is
    // valid, an error object if the badge is not valid.
    if (Badge.validateBody(assertion)) {
      return res.json({ message: "badge assertion appears to be invalid" }, 400);
    }

    // grabbing the remote badge image
    var imageUrl = qualifyUrl(assertion.badge.image, assertion.badge.issuer.origin);
    remote.badgeImage(imageUrl, function (err, imagedata) {
      if (err) {
        var error_msg = "trying to grab image at url " + imageUrl + " got error " + err;
        logger.error(error_msg);
        return res.json({ message: error_msg }, 502);
      }
      // awarding the badge, only done if this is a POST
      if (req.method == 'POST') {
        var opts = {
          assertion: assertion,
          url: assertionUrl,
          imagedata: imagedata,
          recipient: recipient
        };

        awardBadge(opts, function (err, badge) {
          if (err) {
            var error_message = "badge error " + assertionUrl + err;
            logger.error(error_message);
            // check if this badge is a duplicate, currently in the
            // error message
            logger.error(err);
            var dupe_regex = /Duplicate entry/;
            if (dupe_regex.test(err)) {
              return res.json({badge: assertion, exists: true, message: "badge already exists"}, 304);
            }
            // return a general error message
            return res.json({badge: assertion, exists: false, 'message': error_message}, 500);
          }
          logger.debug("badge added " + assertionUrl);
          return res.json({exists: false, badge: assertion}, 201);
        });
      }

      // if this is a GET, we still need to return the badge
      else {
        assertion.badge.image = imageUrl;

        var response = {exists: false, badge: assertion, recipient: recipient};
        Badge.findOne({endpoint: assertionUrl}, function (err, badge) {
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
      }
    });
  }); // end of the assertion grabbing badge adding.
};

exports.validator = function (request, response) {
  var assertion = request.query.assertion || (request.body && request.body.assertion);
  var accept = request.headers['accept'];
  var missingMsg = 'error: could not validate, could not find assertion in `data` field';
  var status = 200;
  var fields = {};

  if (!assertion) {
    status = 400;
    fields = { general: missingMsg };
  }
  else {
    try {
      status = 200;
      var assertionObject = JSON.parse(assertion);
      if (!assertionObject.badge) assertionObject.badge = {};
      if (!assertionObject.badge.issuer) assertionObject.badge.issuer = {};
      var errors = Badge.validateBody(assertionObject);
      if (errors) {
        fields = errors.fields;
        status = 400;
      }
    }

    catch (err) {
      status = 500;
      if (err.name === "SyntaxError") {
        fields = { general: "Could not parse this JSON blob. Make sure it is well formed and try again!" };
      } else {
        fields = { general: err.name + ": " + err.message };
      }
    }
  }

  function humanize(value, field) {
    var url = 'Must either be a fully qualified URL (<code>http://example.com/path/evidence.html</code>) or begin with a forward slash (<code>/path/evidence.html</code>). <br> Non-qualified URLs will be prefixed with the origin specified in <code>badge.issuer.origin</code>';
    var length = 'Cannot be longer than 128 characters';
    var msgs = {
      recipient: 'Must be an email address (<code>someone@example.com</code>) or a hash (<code>sha256$1234567890abcdef</code>)',
      evidence: url,
      "badge.version": 'Must be in the form of <code>x.y</code> or <code>x.y.z</code>',
      "badge.name": length,
      "badge.description": length,
      "badge.image": url.replace(/evidence.html/g, 'image.png'),
      "badge.criteria": url.replace(/evidence.html/g, 'criteria.html'),
      "badge.issuer.name": length,
      "badge.issuer.org": length,
      "badge.issuer.contact": 'Must be an email address',
      "badge.issuer.origin": 'Must be a fully qualified origin (<code>http://example.com</code>)'
    };
    if (value.match(/invalid/)) value = msgs[field] || value;
    return {field: field, value: value};
  }

  var responder = {
    'text/plain': function () {
      response.contentType('txt');
      if (!_.isEmpty(fields)) {
        var values = _.values(fields);
        var bullets = _.map(values, function (s) { return '* ' + s; }).join('\n');
        return response.send(bullets, status);
      }
      else {
        return response.send('everything looks good', 200);
      }
    },

    'application/json': function () {
      response.contentType('json');
      if (fields) {
        return response.json({ status: 'error', errors: _.map(fields, humanize) }, status);
      }
      else {
        return response.json({ status: 'okay' }, 200);
      }
    },

    'default': function () {
      var fielderrors = _.map(fields, humanize);
      return response.render('validator', {
        status: 200,
        errors: fielderrors,
        csrfToken: request.session._csrf,
        submitted: !!assertion,
        success: assertion && _.isEmpty(fields),
        assertion: assertion
      });
    }
  };

  if (!responder[accept]) accept = 'default';
  return responder[accept]();
};

exports.welcome = function(request, response, next) {
  var user = request.user;
  if (!user) return response.redirect(reverse('backpack.login'), 303);

  function makeResponse(err, badges) {
    if (err) return next(err);
    if (badges && badges.length)
      return response.redirect(reverse('backpack.manage'), 303);
    else
      return response.render('issuer-welcome');
  }

  Badge.find({email: user.get('email')}, makeResponse);
};
