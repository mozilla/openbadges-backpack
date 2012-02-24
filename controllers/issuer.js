var request = require('request')
  , logger = require('../lib/logging').logger
  , reverse = require('../lib/router').reverse
  , awardBadge = require('../lib/award')
  , remote = require('../lib/remote')
  , check = require('validator').check


exports.issuerBadgeAddFromAssertion = function(req, res, next) {
  // handles the adding of a badge via assertion url called
  // from issuerBadgeAdd
  // called as an ajax call.
  var user = req.user
    , error = req.flash('error')
    , success = req.flash('success');

  if (!user) return res.redirect(reverse('backpack.login'), 403);

  // get the url param
  var assertionUrl = req.param('url'); // GET
  if (!assertionUrl) {
    var assertionUrl = req.body['url'];
  }

  if (!assertionUrl) return res.render('error', 
                                       { status: 400, 
                                         message: 'Must include a url parameter'});

  // check if the assertion url is malformed
  if (!check(assertionUrl).isUrl()) return res.render('error',
                                                      { status: 400,
                                                        message: 'malformed url'});

  return res.render('error', { status:200, message: 'success i guess'});

  remote.getHostedAssertion(assertionUrl, function(err, assertion) {
    if (err) {
      logger.error("assertion error "+err);
      /*todo: figure out returning an ajax error*/
    }
    if (assertion.recipient !== user.get('email')) {
      /*todo another error*/
    }
    remote.badgeImage(assertion.badge.image, function(err, imagedata) {
      awardBadge(assertion, assertionUrl, imagedata, function(err, badge) {
        if (err) {
          /* todo again, another error */
          logger.error("badge error " + assertionUrl);
        }
        else { logger.debug("badge added " + assertionUrl); }
      })
    })
    logger.debug(assertion);
    return(assertion);
  })
  logger.debug(req.body['assertion']);
};
