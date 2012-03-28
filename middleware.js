var express = require('express')
var secrets = require('./lib/secrets')
var session = require('connect-cookie-session')
var configuration = require('./lib/configuration')
var logger = require('./lib/logging').logger
var crypto = require('crypto')
var User = require('./models/user')
    
// `COOKIE_SECRET` is randomly generated on the first run of the server,
// then stored to a file and looked up on restart to maintain state.
// See the `secrets.js` for more information.
var COOKIE_SECRET = secrets.hydrateSecret('openbadges_cookie', configuration.get('var_path'));
var COOKIE_KEY = 'openbadges_state';

// Store sessions in cookies. The session structure is base64 encoded, a
// salty hash is created with `COOKIE_SECRET` to prevent clientside tampering.
exports.cookieSessions = function(){
  return session({
    secret: COOKIE_SECRET,
    key: COOKIE_KEY,
    cookie: {
      httpOnly: true,
      maxAge: (7 * 24 * 60 * 60 * 1000), //one week
      secure: (configuration.get('protocol') === 'https')
    }
  });
};

var requestLogger = express.logger({
  format: 'dev',
  stream: {
    write: function(x) {
      logger.info(typeof x === 'string' ? x.trim() : x);
    }
  }
});
exports.logRequests = function(){
  return function (request, response, next) {
    var ua = request.headers['user-agent'] || ''
      , heartbeat = (ua.indexOf('HTTP-Monitor') === 0);
    if (heartbeat) return next()
    requestLogger(request, response, next);
  }
};

exports.userFromSession = function (opts) {
  return function (req, res, next) {
    var email = '',
        emailRe = /^.+?\@.+?\.*$/;
    
    if (!req.session) {
      logger.debug('could not find session');
      return next();
    }
    
    if (!req.session.emails) {
      return next();
    }
    
    email = req.session.emails[0];
    
    if (!emailRe.test(email)) {
      logger.warn('req.session.emails does not contain valid user: ' + email);
      req.session = {};
      return req.next();
    }
    
    User.findOrCreate(email, function (err, user) {
      if (err) {
        logger.error("Problem finding/creating user:")
        logger.error(err);
      }
      req.user = user;
      return next();
    })
  }
};

var whitelisted = function(list, input){
  var pattern;
  for (var i = list.length; i--; ) {
    pattern = list[i];
    if (RegExp('^' + list[i] + '$').test(input)) return true;
  }
  return false;
}

exports.noFrame = function(opts) {
  var list = opts.whitelist;
  return function(req, res, next){
    if (!whitelisted(list, req.url)) res.setHeader('x-frame-options', 'DENY');
    return next();
  };
};

exports.cors = function (options) {
  var options = options || {}
  var list = options.whitelist || []
  if (typeof list === 'string') list = [list];
  return function(req, res, next){
    if (!whitelisted(list, req.url)) return next();
    res.header("Access-Control-Allow-Origin", "*");
    return next();
  }
}

// #FIXME: This was pulled from connect/lib/middleware/csrf.js
//         The current version of the csrf middleware checks the token on
//         HEAD requests and it shouldn't. Until issue #409 is resolved,
//         we'll have to use this version.
exports.csrf = function (options) {
  var options = options || {}
    , value = options.value || defaultValue
    , list = options.whitelist
  return function(req, res, next){
    if (whitelisted(list, req.url)) return next();
    
    var token = req.session._csrf || (req.session._csrf = utils.uid(24));
    if ('GET' == req.method || 'HEAD' == req.method) return next();
    var val = value(req);
    if (val != token) {
      logger.debug("CSRF token failure");
      return utils.forbidden(res);
    }
    next();
  }
};

var utils = exports.utils = {};

utils.forbidden = function(res) {
  var body = 'Forbidden';
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', body.length);
  res.statusCode = 403;
  res.end(body);
};

utils.uid = function(len) {
  var buf = []
    , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    , charlen = chars.length;
  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }
  return buf.join('');
};
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Default value function, checking the `req.body`
 * and `req.query` for the CSRF token.
 *
 * @param {IncomingMessage} req
 * @return {String}
 * @api private
 */
function defaultValue(req) {
  return (req.body && req.body._csrf)
    || (req.query && req.query._csrf)
    || (req.headers['x-csrf-token']);
}
