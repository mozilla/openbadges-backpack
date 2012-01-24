var mysql = require('mysql')
  , url = require('url')
  , Base = require('./mysql-base')
  , urlre = /(^(https?):\/\/[^\s\/$.?#].[^\s]*$)|(^\/\S+$)/
  , emailre = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
  , originre = /^(https?):\/\/[^\s\/$.?#].[^\s\/]*$/
  , versionre = /^v?\d+\.\d+\.\d+$/
  , isodatere = /\d{4}-\d{2}-\d{2}/;

var maxlen = function(len) { return function(v){ return (v||'').length < len } }
var slashTrim = function (v) { return v.replace(/\/*$/, ''); }
var qualifiedURL = function(v){
  if (!v) return v;
  var baseurl = url.parse(v)
    , origin
  if (!baseurl.hostname) {
    origin = url.parse(this.meta.pingback || this.badge.issuer.origin)
    baseurl.host = origin.host;
    baseurl.port = origin.port;
    baseurl.slashes = origin.slashes;
    baseurl.protocol = origin.protocol;
    baseurl.hostname = origin.hostname;
  }
  return url.format(baseurl);
}
var BadgeSchema = 
  { recipient : { type: String, required: true, match: emailre, index: true }
  , evidence  : { type: String, match: urlre}
  , expires   : { type: String }
  , issued_on : { type: String }
  , badge:
    { version     : { type: String, required: true, match: versionre }
    , name        : { type: String, required: true, validate: [maxlen(128), 'maxlen'] }
    , description : { type: String, required: true, validate: [maxlen(128), 'maxlen'] }
    , image       : { type: String, required: true, match: urlre }
    , criteria    : { type: String, required: true, match: urlre }
    , issuer:
      { origin  : { type: String, required: true, match: originre }
      , name    : { type: String, required: true, validate: [maxlen(128), 'maxlen'] }
      , org     : { type: String, validate: [maxlen(128), 'maxlen'] }
      , contact : { type: String, match: emailre, index: true }
      }
    }
  }

var Badge = function (data) {
  this.data = data;
  this.prepare = {
    body: function (v) { return JSON.stringify(v); }
  }
  
  this.save = function (v) {
    console.log('rad');
    this.super('save', arguments);
  }
}
Base.apply(Badge, 'badge');
module.exports = Badge;