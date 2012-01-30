var express = require('express')
  , sessions = require('connect-cookie-session')
  , form = require('connect-form')
  , secrets = require('./lib/secrets')
  , configuration = require('./lib/configuration')
  , logger = require('./lib/logging').logger
  , crypto = require('crypto')

// `COOKIE_SECRET` is randomly generated on the first run of the server,
// then stored to a file and looked up on restart to maintain state.
// See the `secrets.js` for more information.
var COOKIE_SECRET = secrets.hydrateSecret('openbadges_cookie', configuration.get('var_path'));
var COOKIE_KEY = 'openbadges_state';

// Store sessions in cookies. The session structure is base64 encoded, a
// salty hash is created with `COOKIE_SECRET` to prevent clientside tampering.
exports.cookieSessions = function(){
  return sessions({
    secret: COOKIE_SECRET,
    key: COOKIE_KEY,
    cookie: {
      httpOnly: true,
      maxAge: (7 * 24 * 60 * 60 * 1000), //one week
      secure: false
    }
  });
};

exports.logRequests = function(){
  return express.logger({
    format: 'dev',
    stream: {
      write: function(x) {
        logger.info(typeof x === 'string' ? x.trim() : x);
      }
    }
  });
};

exports.noFrame = function(whitelist) {
  var whitelisted = function(input){
    for (var i = whitelist.length; i--; ) {
      if (RegExp('^' + whitelist[i] + '$').test(input)) return true;
    }
    return false;
  }
  return function(req, res, next){
    if (!whitelisted(req.url)) res.setHeader('x-frame-options', 'DENY');
    next();
  };
};

// #TODO: use a form handler that supports HTML5 multiple for files.
exports.formHandler = function(){
  return form({keepExtensions: true});
}


// #FIXME: This was pulled from connect/lib/middleware/csrf.js
//         The current version of the csrf middleware checks the token on
//         HEAD requests and it shouldn't. Until issue #409 is resolved,
//         we'll have to use this version.
exports.csrf = function (options) {
  var options = options || {}
    , value = options.value || defaultValue;

  return function(req, res, next){
    var token = req.session._csrf || (req.session._csrf = utils.uid(24));
    if ('GET' == req.method || 'HEAD' == req.method) return next();
    var val = value(req);
    if (val != token) return utils.forbidden(res);
    next();
  }
};

var utils = {}
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
