var mongoose = require('mongoose')
  , conf = require('../lib/configuration').get('database')
  , url = require('url')
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , urlre = /(^(https?):\/\/[^\s\/$.?#].[^\s]*$)|(^\/\S+$)/
  , emailre = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
  , originre = /^(https?):\/\/[^\s\/$.?#].[^\s\/]*$/
  , versionre = /^v?\d+\.\d+\.\d+$/

mongoose.connect(conf.host, conf.name, conf.port);

// validators and getters. Consider moving to its own file.
var maxlen = function(len){
  return function(v){ return (v||'').length < len }
}
var slashTrim = function(v){
  return v.replace(/\/*$/, '');
}
var isodate = function(){}
isodate.re = /\d{4}-\d{2}-\d{2}/;
isodate.set = function(input) {
  if (!isodate.re.test(input)) return false;
  var pieces = input.split('-')
    , year = parseInt(pieces[0], 10)
    , month = parseInt(pieces[1], 10)
    , day = parseInt(pieces[2], 10)
  if (month > 12 || month < 1) return false;
  if (day > 31 || day < 1) return false;
  return input;
};
isodate.validate = function(v) {
  return v === null || v.match(isodate.re) ;
}
var fqUrl = function(v){
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

var BadgeSchema = new Schema(
  { meta:
    { pingback  : { type: String }
    , publicKey : { type: String }
    , imagePath : { type: String }
    , imageData : { type: String } //expected base64
    , accepted : { type: Boolean, default: false }
    , rejected : { type: Boolean, default: false }
    , groups : { type: [ObjectId], default: [] }
    }
  , recipient : { type: String, required: true, match: emailre, index: true }
  , evidence  : { type: String, match: urlre, get: fqUrl}
  , expires   : { type: String, set: isodate.set, validate: [isodate.validate, 'isodate'] }
  , issued_on : { type: String, set: isodate.set, validate: [isodate.validate, 'isodate'] }
  , badge:
    { version     : { type: String, required: true, match: versionre }
    , name        : { type: String, required: true, validate: [maxlen(128), 'maxlen'] }
    , description : { type: String, required: true, validate: [maxlen(128), 'maxlen'] }
    , image       : { type: String, required: true, match: urlre, get: fqUrl }
    , criteria    : { type: String, required: true, match: urlre, get: fqUrl }
    , issuer:
      { origin  : { type: String, required: true, match: originre, set: slashTrim }
      , name    : { type: String, required: true, validate: [maxlen(128), 'maxlen'] }
      , org     : { type: String, validate: [maxlen(128), 'maxlen'] }
      , contact : { type: String, match: emailre, index: true }
      }
    }
  }
)

var BadgeModel = module.exports = mongoose.model('Badge', BadgeSchema);

BadgeModel.prototype.upsert = function(callback) {
  var self = this
    , query = {recipient: this.recipient, 'meta.pingback': this.meta.pingback}
  BadgeModel.findOne(query, function(err, doc) {
    var id;
    if (doc) {
      self._doc._id = doc._doc._id;
      doc._doc = self._doc;
      doc.save(callback);
    } else {
      self.save(callback);
    }
  })
}
BadgeModel.groups = function(badges) {
  var groups = {}
  badges.forEach(function(badge){
    (badge.meta.groups||[]).forEach(function(group) {
      var g = groups[group] = (groups[group] || []);
      g.push(badge);
    })
  })
  return groups;
}
BadgeModel.organize = function(user, callback) {
  BadgeModel.find({recipient: user}, function(err, badges){
    if (err) return callback(err);
    badges = badges||[]
    var o =
      { pending: []
      , accepted: []
      , rejected: []
      , groups: BadgeModel.groups(badges)
      , issuers: {}
      , howMany: badges.length + (badges.length === 1 ? " badge" : " badges")
      }

    badges.forEach(function(badge){
      if (badge.meta.rejected)
        return o.rejected.push(badge)
      if (badge.meta.accepted)
        return o.accepted.push(badge)
      return o.pending.push(badge)
    })
    return callback(null, o);
  })
}
BadgeModel.userGroups = function(user, callback) {
  BadgeModel.find({recipient: user}, ['meta.groups'], function(err, docs) {
    if (err) return callback(err)
    return callback(err, BadgeModel.groups(docs))
  })
}
BadgeModel.prototype.group = function(name) {
  var g = this.meta.groups || []
  if (g.indexOf(name) === -1) g.push(name);
  this.meta.groups = g;
}
BadgeModel.prototype.degroup = function(name) {
  this.meta.groups = this.get('meta.groups').filter(function(v){ return v !== name });
  return this;
}
BadgeModel.prototype.inGroup = function(name) {
  return (this.meta.groups||[]).indexOf(name) !== -1
}
