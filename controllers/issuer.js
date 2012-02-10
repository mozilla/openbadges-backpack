var request = require('request')
  , logger = require('../lib/logging').logger
  , reverse = require('../lib/router').reverse
  , awardBadge = require('../lib/award')
  , remote = require('../lib/remote') 

exports.issuerBadgeAdd = function(req, res, next) {
  var user = req.user
    , error = req.flash('error')
    , success = req.flash('success');

  if (!user) return res.redirect(reverse('backpack.login'), 303);

  res.render('issuerBadgeAdd', {
    error: error,
    success: success,
    layout: 'smallLayout',
    csrfToken: req.session._csrf,
    // todo: need to add csrf here
    })
};
   

exports.issuerBadgeAddFromAssertion = function(req, res, next) {
  // handles the adding of a badge via assertion url called
  // from issuerBadgeAdd
  // called as an ajax call.
  var assertionUrl = req.body['assertion'];
  var user = req.user;
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

