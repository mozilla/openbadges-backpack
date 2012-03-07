var fs = require('fs');

var myFiles = [
  "issuer-parts/issuer-script-intro.js"
, "jquery.min.js"
, "jschannel.js"
, "issuer-parts/issuer-core.js"
, "issuer-parts/issuer-script-outro.js"
];

myFiles = myFiles.map(function(filename) {
  return __dirname + '/../static/js/' + filename;
});

exports.generateScript = function(req, res) {
  concatenate(myFiles, function(err, data) {
    if (err) {
      res.send(500);
      throw err;
    } else {
      res.header('Content-Type', 'application/javascript');
      res.send(data);
    }
  });
};

exports.frame = function(req, res) {
  res.render('issuer-frame', {
    layout: null,
    csrfToken: req.session._csrf,
    email: req.session.emails && req.session.emails[0]
  });
};

function concatenate(files, cb) {
  var completed = 0;
  var contents = [];
  
  function startLoading(i) {
    fs.readFile(files[i], function(err, data) {
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
};

if (module.parent === null) {
  concatenate(myFiles, function(err, data) {
    var filename = 'issuer.js';
    if (err)
      throw err;
    fs.writeFileSync(filename, data);
    console.log('wrote', filename, '(' + data.length, 'bytes)');
  });
}

var request = require('request')
  , logger = require('../lib/logging').logger
  , reverse = require('../lib/router').reverse
  , awardBadge = require('../lib/award')
  , remote = require('../lib/remote')
  , validator = require('validator')
  , Badge = require('../models/badge.js')


exports.issuerBadgeAddFromAssertion = function(req, res, next) {
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
  var user = req.user
    , error = req.flash('error')
    , success = req.flash('success');

  // is the user logged in? if not, suggest they redirect to the login page
  if (!user) return res.json({message:"user is not logged in, redirect to " + reverse('backpack.login'),
                              redirect_to: reverse('backpack.login')}, 403);

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
    if (!assertionUrl && req.method=='GET') {
      logger.debug("GET is erroring this was the original url " + req.originalUrl);
      logger.debug(JSON.stringify(req.body));
    }
  }

  // no assertionUrl was passed, return error
  if (!assertionUrl) {
    logger.error("didn't receive an assertionUrl returning 400");
    return res.json({message: 'url is a required param'}, 400);
  }

  // check if the assertion url is malformed
  try {
    validator.check(assertionUrl).isUrl();
  } 
  catch (e) {                      
    logger.error("malformed url " + assertionUrl + " returning 400");
    return res.json({message: 'malformed url'}, 400);
  }

  /* grabbing the remote assertion, 3 nested steps - 
   * 
   * 1) grab the remote assertion
   * 2) grab the remote badge image
   * if the request is a POST 
   * 3) award the badge
   */
  remote.getHostedAssertion(assertionUrl, function(err, assertion) {
    var recipient = user.get('email');
    if (err) {
      var error_msg = "trying to grab url " + assertionUrl + " got error " + err;
      logger.error(error_msg);
      return res.json({message: error_msg}, 502) ;
    }
    
    var userOwnsBadge = Badge.confirmRecipient(assertion, recipient);
    if (req.method == 'POST' &&  !userOwnsBadge) {
      return res.json({message: "badge assertion is for a different user"}, 403);
    }
    
    // grabbing the remote badge image
    remote.badgeImage(assertion.badge.image, function(err, imagedata) {
      // awarding the badge, only done if this is a POST
      if (req.method=='POST') {
        var opts = {
          assertion: assertion,
          url: assertionUrl,
          imagedata: imagedata,
          recipient: recipient
        }
        awardBadge(opts, function(err, badge) {
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

          return res.json({exists: false, badge:assertion}, 201);
        });
      }
      // if this is a GET, we still need to return the badge
      else {
        var response = {exists: false, badge:assertion};
        Badge.findOne({endpoint: assertionUrl}, function(err, badge) {
          if (err) {
            logger.error(err);
            return res.json({message: "internal server error"}, 500);
          }
          if (badge && badge.get("user_id") == req.user.get("id"))
            response.exists = true;
          return res.json(response, 200);
        });
      }
    });
  }); // end of the assertion grabbing badge adding.
};
