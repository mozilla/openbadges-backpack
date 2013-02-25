var url = require('url');
var mysql = require('../lib/mysql');
var Base = require('./mysql-base');

const DEFAULT_TOKEN_LENGTH = 24;

var getOrigin = function getOrigin(value) {
  var parsed = url.parse(value, false, true);
  
  return parsed.protocol + "//" + parsed.host;
};

var Session = exports.Session = function(attributes, options) {
  options = options || {};
  this.attributes = attributes;
  this.attributes.origin = getOrigin(attributes.origin);
  this.tokenLength = options.tokenLength || DEFAULT_TOKEN_LENGTH;
  this._uid = options.uid || require('../middleware').utils.uid;
  this._now = options.now || Date.now.bind(Date);
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

Session.prototype.hasPermission = function(name) {
  return this.get('permissions').indexOf(name) != -1;
};

Session.prototype.refresh = function() {
  this.set('access_token', this._uid(this.tokenLength));
  this.set('access_time', Math.floor(this._now() / 1000));
  this.set('refresh_token', this._uid(this.tokenLength));
};

Session.prototype.presave = function () {
  if (!this.get('access_token'))
    this.refresh();
};
