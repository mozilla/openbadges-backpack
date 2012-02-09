var request = require('request')
  , logger = require('../lib/logging').logger
  , reverse = require('../lib/router').reverse
 

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
  debugger;
  logger.debug(req.body['assertion']);
  return('success');
};

