var querystring = require('querystring');
var url = require('url');

var logger = require('../lib/logging').logger;

var BackpackConnect = module.exports = function BackpackConnect(options) {
  this.Model = options.Model ||
               require('../models/backpack-connect').Session;
  this.UserModel = options.UserModel || require('../models/user');
  this.apiRoot = options.apiRoot;
  this.realm = options.realm;
};

// TODO: This is mostly duplicated from controllers/displayer.js; we should
// consolidate the two functions.
function fullUrl(pathname) {
  var conf = require('../lib/configuration');
  var base = url.format({
    protocol: conf.get('protocol'),
    hostname: conf.get('hostname'),
    port: conf.get('port')
  });
  return url.resolve(base, pathname);
}

BackpackConnect.prototype = {
  refresh: function() { return refresh.bind(this); },
  requestAccess: function() { return requestAccess.bind(this); },
  allowAccess: function() { return allowAccess.bind(this); },
  authorize: function(perm) { return authorize.bind(this, perm); }
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

function requestAccess(req, res) {
  if (!req.query.callback)
    return res.send('callback expected', 400);
  if (!req.query.scope)
    return res.send('scope expected', 400);

  var originErr = this.Model.validators.origin(req.query.callback);
  var scopes = req.query.scope.split(',');
  var scopeErr = this.Model.validators.permissions(scopes);
  var parsed = url.parse(req.query.callback, false, true);
  
  if (originErr)
    return res.send('invalid callback: ' + originErr, 400);
  if (scopeErr)
    return res.send('invalid scope: ' + scopeErr, 400);
  
  return res.render('backpack-connect.html', {
    clientDomain: parsed.hostname,
    csrfToken: req.session._csrf,
    joinedScope: req.query.scope,
    scopes: scopes,
    callback: req.query.callback
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

function authorize(permission, req, res, next) {
  var User = this.UserModel;
  var auth = (req.headers['authorization'] || '').match(/^Bearer (.+)$/);
  var bearerRealmStr = 'Bearer realm="' + this.realm + '"';
  var tokenError = function(type, desc) {
    // For more information on this, see:
    // http://tools.ietf.org/html/rfc6750#section-3.1
    res.header('WWW-Authenticate', [
      bearerRealmStr,
      'error="' + type + '"',
      'error_description="' + desc + '"'
    ].join(', '));
    return res.send(type + ": " + desc, 401);
  };
  var invalidTokenError = tokenError.bind(null, "invalid_token");

  if (!auth) {
    res.header('WWW-Authenticate', bearerRealmStr);
    return res.send("access token expected", 401);
  }
  
  auth = new Buffer(auth[1], 'base64').toString('ascii');
  
  this.Model.find({access_token: auth}, function(err, results) {
    if (err) {
      logger.warn('There was an error retrieving an access token');
      logger.debug(err);
      return res.send(500);
    }
    if (results.length) {
      if (results[0].isExpired())
        return invalidTokenError("The access token expired");
      if (permission && !results[0].hasPermission(permission))
        return tokenError("insufficient_scope",
                          "Scope '" + permission + "' is required");
      req.backpackConnect = results[0];
      User.find({id: results[0].get('user_id')}, function(err, results) {
        if (err || !results.length) {
          logger.warn('There was an error retrieving a user');
          logger.debug(err);
          return res.send(500);
        }
        req.user = results[0];
        return next();
      });
    } else {
      return invalidTokenError("Unknown access token");
    }
  });
}
