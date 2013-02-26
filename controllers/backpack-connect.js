var querystring = require('querystring');

var logger = require('../lib/logging').logger;

var BackpackConnect = module.exports = function BackpackConnect(options) {
  this.Model = options.Model ||
               require('../models/backpack-connect').Session;
  this.apiRoot = options.apiRoot;
  this.realm = options.realm;
};

// TODO: This is mostly duplicated from controllers/displayer.js; we should
// consolidate the two functions.
function fullUrl(pathname) {
  var conf = require('../lib/configuration');
  var url = require('url');
  var base = url.format({
    protocol: conf.get('protocol'),
    hostname: conf.get('hostname'),
    port: conf.get('port')
  });
  return url.resolve(base, pathname);
}

BackpackConnect.prototype = {
  refresh: function() { return refresh.bind(this); },
  allowAccess: function() { return allowAccess.bind(this); },
  authorize: function() { return authorize.bind(this); }
};

function refresh(req, res) {
  if (!req.body)
    return res.send('body expected', 400);
  if (req.body.grant_type != "refresh_token")
    return res.send('invalid grant_type', 400);
  
  var refresh_token = req.body.refresh_token || '';
  
  this.Model.find({refresh_token: refresh_token}, function(err, results) {
    var session = results && results[0];
    if (err) {
      logger.warn('There was an error looking up a refresh token');
      logger.debug(err);
      return res.send(500);
    }
    if (session) {
      session.refresh();
      session.save(function(err) {
        if (err) {
          logger.warn('There was an error saving a refreshed token');
          logger.debug(err);
          return res.send(500);
        }
        return res.send({
          expires: session.tokenLifetime,
          access_token: session.get('access_token'),
          refresh_token: session.get('refresh_token')
        });
      });
    } else {
      return res.send('invalid refresh_token', 400);
    }
  });
}

function allowAccess(req, res) {
  if (!req.user)
    return res.send(403);
  if (!req.body)
    return res.send('body expected', 400);
  if (!req.body.callback)
    return res.send('callback expected', 400);
  if (!req.body.scope)
    return res.send('scope expected', 400);
  
  var originErr = this.Model.validators.origin(req.body.callback);
  var scopes = req.body.scope.split(',');
  var scopeErr = this.Model.validators.permissions(scopes);
  var apiRoot = this.apiRoot;
  var session;
  
  if (originErr)
    return res.send('invalid callback: ' + originErr, 400);
  if (scopeErr)
    return res.send('invalid scope: ' + scopeErr, 400);

  session = new this.Model({
    origin: req.body.callback,
    user_id: req.user.get('id'),
    permissions: scopes
  });
  session.save(function(err) {
    if (err) {
      logger.warn('There was an error creating a backpack connect token');
      logger.debug(err);
      return res.send(500);
    }
    return res.redirect(req.body.callback + "?" + querystring.stringify({
      access_token: session.get('access_token'),
      refresh_token: session.get('refresh_token'),
      expires: session.tokenLifetime,
      api_root: fullUrl(apiRoot)
    }), 303);
  });
}

function authorize(req, res, next) {
  var auth = (req.headers['authorization'] || '').match(/^Bearer (.+)$/);
  var bearerRealmStr = 'Bearer realm="' + this.realm + '"';
  var invalidTokenError = function(desc) {
    // For more information on this, see:
    // http://tools.ietf.org/html/rfc6750#section-3.1
    res.header('WWW-Authenticate', [
      bearerRealmStr,
      'error="invalid_token"',
      'error_description="' + desc + '"'
    ].join(', '));
    return res.send(401);
  };

  if (!auth) {
    res.header('WWW-Authenticate', bearerRealmStr);
    return res.send("access token expected", 401);
  }
  
  this.Model.find({access_token: auth[1]}, function(err, results) {
    if (err) {
      logger.warn('There was an error retrieving an access token');
      logger.debug(err);
      return res.send(500);
    }
    if (results.length) {
      if (results[0].isExpired())
        return invalidTokenError("The access token expired");
      req.backpackConnect = results[0];
      return next();
    } else {
      return invalidTokenError("Unknown access token");
    }
  });
}
