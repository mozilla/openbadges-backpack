var express = require('express')
  , sessions = require('connect-cookie-session')
  , form = require('connect-form')
  , secrets = require('./lib/secrets')
  , configuration = require('./lib/configuration')
  , logger = require('./lib/logging').logger

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
// #TODO: use a form handler that supports HTML5 multiple for files.
exports.formHandler = function(){
  return form({keepExtensions: true});
}