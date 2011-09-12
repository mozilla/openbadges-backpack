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

exports.noFrame = function(){
  return function(req, res, next){
    res.setHeader('x-frame-options', 'DENY');
    next();
  };
};


var csrf = null;
exports.csrf = {}
exports.csrf.token = function(req, res) {
  if (!(typeof csrf !== "undefined" && csrf !== null)) {
    csrf = crypto.createHash('md5').update('' + new Date().getTime() + req.session.lastAccess).digest('hex');
    req.session.csrf = csrf;
  }
  return csrf;
};

exports.csrf.check = function(whitelist) {
  var whitelisted = function(input){
    for (var i = whitelist.length; i--; ) {
      if (RegExp('^' + whitelist[i] + '$').test(input)) return true;
    }
    return false;
  }
  return function(req, res, next) {
    csrf = null; // Clear csrf for next request
    if (req.method.toLowerCase() === 'post' && !whitelisted(req.url)) {
      console.dir(req.url);
      if (!(req.body && 'csrf' in req.body && req.body.csrf === req.session.csrf)) {
        return res.send("Cross-site request forgery attempt discovered!", 403);
      }
    }
    return next();
  };
};

// #TODO: use a form handler that supports HTML5 multiple for files.
exports.formHandler = function(){
  return form({keepExtensions: true});
}