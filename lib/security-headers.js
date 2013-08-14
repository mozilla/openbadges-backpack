var PERSONA_ORIGIN = require('./persona').ORIGIN;

function securityHeaders(options) {
  return function(req, res, next) {
    res.set('X-Frame-Options', 'DENY');
    res.set('X-Content-Type-Options', 'nosniff');
    if (options.enableHSTS)
      res.set('Strict-Transport-Security',
              'max-age=31536000; includeSubDomains');

    addContentSecurityPolicy(req, res);
    next();
  };
}

function addContentSecurityPolicy(req, res) {
  var policies = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      PERSONA_ORIGIN
    ],
    'frame-src': [PERSONA_ORIGIN],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ['*'],
    // options is deprecated, but Firefox still needs it.
    'options': []
  };
  if (req.path == '/test/') {
    // Some of our testing tools, e.g. sinon, use eval(), so we'll
    // enable it for this one endpoint.
    policies['script-src'].push("'unsafe-eval'");
    policies['options'].push('eval-script');
  }
  var directives = [];
  Object.keys(policies).forEach(function(directive) {
    directives.push(directive + ' ' + policies[directive].join(' '));
  });
  var policy = directives.join('; ');
  res.set('Content-Security-Policy', policy);
  res.set('X-Content-Security-Policy', policy);
  res.set('X-WebKit-CSP', policy);
}

module.exports = securityHeaders;
