var _ = require('underscore');

// Copy-pasted from express-persona's index.js.
var defaultOptions = {
  audience: "",
  logoutPath: "/persona/logout",
  sessionKey: "email",
  verifierURI: "https://verifier.login.persona.org/verify",
  verifyPath: "/persona/verify",
  verifyResponse: function(error, req, res, email) {
    var out;
    if (error) {
      out = { status: "failure", reason: error };
    } else {
      out = { status: "okay", email: email };
    }
    res.json(out);
  },
  logoutResponse: function(error, req, res) {
    var out;
    if (error) {
      out = { status: "failure", reason: error };
    } else {
      out = { status: "okay" };
    }
    res.json(out);
  }
};

module.exports = function(app, options) {
  options = _.extend({}, defaultOptions, options);

  app.post(options.verifyPath, function(req, res) {
    var email = req.body.assertion;
    req.session[options.sessionKey] = email;
    options.verifyResponse(null, req, res, email);
  });

  app.post(options.logoutPath, function(req, res) {
    req.session[options.sessionKey] = null;
    options.logoutResponse(null, req, res);
  });
};
