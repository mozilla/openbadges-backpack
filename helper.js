// helpers -- like per-route middleware
var logger = require('./lib/logging').logger

exports.authRequired = function(controller){
  return function(req, res){
    if (!req.session) req.session = {}
    if (!req.session.authenticated) {
      res.redirect('login', 303);
    }
    logger.warn('will require authentication');
    return controller(req, res);
  }
}

exports.directTemplate = function(template, opts) {
  return function(req, res) {
    opts = opts || {}
    res.render(template, opts);
  }
}