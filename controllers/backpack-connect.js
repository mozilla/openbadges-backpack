var url = require('url');
var utils = require('../lib/utils');
var logger = require('../lib/logging').logger;

var BackpackConnect = module.exports = function BackpackConnect(options) {
  this.Model = options.Model ||
               require('../models/backpack-connect').Session;
  this.UserModel = options.UserModel || require('../models/user');
  this.apiRoot = options.apiRoot;
  this.realm = options.realm;
};

BackpackConnect.prototype = {
  hashIdentity: function() { return hashIdentity.bind(this); },
  revokeOrigin: function() { return revokeOrigin.bind(this); },
  refresh: function() { return refresh.bind(this); },
  requestAccess: function() { return requestAccess.bind(this); },
  allowAccess: function() { return allowAccess.bind(this); },
  allowCors: function() { return allowCors.bind(this); },
  authorize: function(perm) { return authorize.bind(this, perm); }
};

function hashIdentity(req, res, next) {
  return res.send(this.Model.makeRecipientHash(req.user.get('email')));
}

function revokeOrigin(req, res, next) {
  if (!req.user)
    return res.send(403);
  if (!req.body)
    return res.type('text').send('body expected', 400);
  if (!req.body.origin)
    return res.type('text').send('origin URL expected', 400);

  this.Model.revokeOriginForUser({
    origin: req.body.origin,
    user_id: req.user.get('id')
  }, function(err) {
    if (err) {
      logger.warn('There was an error revoking an origin for a user');
      logger.debug(err);
      return next(err);
    }
    return res.send(204);
  });
};

function refresh(req, res, next) {
  if (!req.body)
    return res.type('text').send('body expected', 400);
  if (req.body.grant_type != "refresh_token")
    return res.type('text').send('invalid grant_type', 400);
  
  var refresh_token = req.body.refresh_token || '';
  
  this.Model.find({refresh_token: refresh_token}, function(err, results) {
    var session = results && results[0];
    if (err) {
      logger.warn('There was an error looking up a refresh token');
      logger.debug(err);
      return next(err);
    }
    if (!session)
      return res.type('text').send('invalid refresh_token', 400);
    if (req.headers['origin']) {
      res.set('access-control-allow-origin', session.get('origin'));
      if (session.get('origin') != req.headers['origin'])
        return res.type('text').send("invalid origin", 401);
    }

    session.refresh();
    session.save(function(err) {
      if (err) {
        logger.warn('There was an error saving a refreshed token');
        logger.debug(err);
        return next(err);
      }
      return res.send({
        expires: session.tokenLifetime,
        access_token: session.get('access_token'),
        refresh_token: session.get('refresh_token')
      });
    });
  });
}

function requestAccess(req, res) {
  if (!req.query.callback)
    return res.type('text').send('callback expected', 400);
  if (!req.query.scope)
    return res.type('text').send('scope expected', 400);

  var originErr = this.Model.validators.origin(req.query.callback);
  var scopes = req.query.scope.split(',');
  var scopeErr = this.Model.validators.permissions(scopes);
  var parsed = url.parse(req.query.callback, false, true);
  
  if (originErr)
    return res.type('text').send('invalid callback: ' + originErr, 400);
  if (scopeErr)
    return res.type('text').send('invalid scope: ' + scopeErr, 400);
  
  return res.render('backpack-connect.html', {
    clientDomain: parsed.hostname,
    csrfToken: req.session._csrf,
    joinedScope: req.query.scope,
    scopes: scopes,
    callback: req.query.callback,
    denyCallback: utils.extendUrl(req.query.callback, {error: 'access_denied'})
  });
}

function allowAccess(req, res, next) {
  if (!req.user)
    return res.send(403);
  if (!req.body)
    return res.type('text').send('body expected', 400);
  if (!req.body.callback)
    return res.type('text').send('callback expected', 400);
  if (!req.body.scope)
    return res.type('text').send('scope expected', 400);
  
  var originErr = this.Model.validators.origin(req.body.callback);
  var scopes = req.body.scope.split(',');
  var scopeErr = this.Model.validators.permissions(scopes);
  var apiRoot = this.apiRoot;
  var session;
  
  if (originErr)
    return res.type('text').send('invalid callback: ' + originErr, 400);
  if (scopeErr)
    return res.type('text').send('invalid scope: ' + scopeErr, 400);

  session = new this.Model({
    origin: req.body.callback,
    user_id: req.user.get('id'),
    permissions: scopes
  });
  session.save(function(err) {
    if (err) {
      logger.warn('There was an error creating a backpack connect token');
      logger.debug(err);
      return next(err);
    }
    return res.redirect(utils.extendUrl(req.body.callback, {
      access_token: session.get('access_token'),
      refresh_token: session.get('refresh_token'),
      expires: session.tokenLifetime,
      api_root: utils.fullUrl(apiRoot)
    }), 303);
  });
}

function allowCors(req, res, next) {
  res.set('access-control-allow-origin', '*');
  res.set('access-control-allow-headers', 'Content-Type, Authorization');
  res.set('access-control-expose-headers', 'WWW-Authenticate');
  if (req.method == 'OPTIONS')
    return res.send(200);
  next();
}

function authorize(permission, req, res, next) {
  var User = this.UserModel;
  var auth = /^Bearer (.+)$/.exec(req.headers['authorization']);
  var bearerRealmStr = 'Bearer realm="' + this.realm + '"';
  var tokenError = function(type, desc) {
    // For more information on this, see:
    // http://tools.ietf.org/html/rfc6750#section-3.1
    res.header('WWW-Authenticate', [
      bearerRealmStr,
      'error="' + type + '"',
      'error_description="' + desc + '"'
    ].join(', '));
    return res.type('text').send(type + ": " + desc, 401);
  };
  var invalidTokenError = tokenError.bind(null, "invalid_token");

  if (!auth) {
    res.header('WWW-Authenticate', bearerRealmStr);
    return res.type('text').send("access token expected", 401);
  }
  
  auth = new Buffer(auth[1], 'base64');
  
  this.Model.find({access_token: auth}, function(err, results) {
    if (err) {
      logger.warn('There was an error retrieving an access token');
      logger.debug(err);
      return next(err);
    }
    if (!results.length)
      return invalidTokenError("Unknown access token");
    const token = results[0];
    if (token.isExpired())
      return invalidTokenError("The access token expired");
    if (permission && !token.hasPermission(permission))
      return tokenError("insufficient_scope",
                        "Scope '" + permission + "' is required");
    req.backpackConnect = token;
    if (req.headers['origin']) {
      res.set('access-control-allow-origin', token.get('origin'));
      if (token.get('origin') != req.headers['origin'])
        return res.type('text').send("invalid origin", 401);
    }
    User.find({id: token.get('user_id')}, function(err, results) {
      if (err || !results.length) {
        logger.warn('There was an error retrieving a user');
        if (!err) err = new Error("user with id not found");
        logger.debug(err);
        return next(err);
      }
      req.user = results[0];
      return next();
    });
  });
}
