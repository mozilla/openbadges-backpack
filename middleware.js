var secrets = require('./lib/secrets')
  , sessions = require('connect-cookie-session')
  , configuration = require('./lib/configuration')
  , logger = require('./lib/logging').logger
  , express = require('express')

const COOKIE_SECRET = secrets.hydrateSecret('openbadges_cookie', configuration.get('var_path'));
const COOKIE_KEY = 'openbadges_state';

exports.cookieSessions = function(){
  return sessions({
    secret: COOKIE_SECRET,
    key: COOKIE_KEY,
    cookie: {
      httpOnly: true,
      maxAge: (7 * 24 * 60 * 60 * 1000), //one week
      secure: false
    }
  })
}

exports.logRequests = function(){
  return express.logger({
    format: 'dev',
    stream: {
      write: function(x) {
        logger.info(typeof x === 'string' ? x.trim() : x);
      }
    }
  })
}