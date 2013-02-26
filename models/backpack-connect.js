var url = require('url');
var mysql = require('../lib/mysql');
var Base = require('./mysql-base');

const DEFAULT_TOKEN_LENGTH = 24;
const DEFAULT_TOKEN_LIFETIME = 60 * 60;
const DEFAULT_VALID_PERMS = ["issue"];

var getOrigin = function getOrigin(value) {
  var parsed = url.parse(value, false, true);
  
  return parsed.protocol + "//" + parsed.host;
};

function SessionFactory(options) {
  var validPermissions = options.validPermissions || DEFAULT_VALID_PERMS;
  var tokenLength = options.tokenLength || DEFAULT_TOKEN_LENGTH;
  var tokenLifetime = options.tokenLifetime || DEFAULT_TOKEN_LIFETIME;
  var uid = options.uid || function(length) {
    // Ultra-late binding here ensures that any last-minute
    // test fakes/stubs/mocks will be invoked.
    return require('../middleware').utils.uid(length);
  };
  var now = options.now || Date.now.bind(Date);
  var nowSecs = function() { return Math.floor(now() / 1000); };
  var Session = exports.Session = function(attributes) {
    this.attributes = attributes;
    this.attributes.origin = getOrigin(attributes.origin);
    this.tokenLength = tokenLength;
    this.tokenLifetime = tokenLifetime;
  };

  Base.apply(Session, 'bpc_session');

  Session.validators = {
    origin: function(value, attributes) {
      var parsedOrigin = url.parse(value, false, true);
    
      if (!(parsedOrigin.protocol &&
            parsedOrigin.protocol.match(/^https?:/)))
        return "invalid origin protocol";
    
      if (!parsedOrigin.host)
        return "invalid origin host";
    },
    permissions: function(perms) {
      var invalid = perms.filter(function(perm) {
        return validPermissions.indexOf(perm) == -1;
      });
      
      if (invalid.length)
        return "invalid permission(s): " + invalid.join(', ');
    }
  };

  Session.prepare = {
    'in': {
      permissions: function(value) { return value.join(','); }
    },
    'out': {
      permissions: function(value) { return value.split(','); }
    }
  };

  Session.prototype.isExpired = function() {
    return this.get('access_time') + tokenLifetime < nowSecs();
  };

  Session.prototype.hasPermission = function(name) {
    return this.get('permissions').indexOf(name) != -1;
  };

  Session.prototype.refresh = function() {
    this.set('access_token', uid(tokenLength));
    this.set('access_time', nowSecs());
    this.set('refresh_token', uid(tokenLength));
  };

  Session.prototype.presave = function () {
    if (!this.get('access_token'))
      this.refresh();
  };
  
  return Session;
};

exports.SessionFactory = SessionFactory;
exports.Session = new SessionFactory({});
