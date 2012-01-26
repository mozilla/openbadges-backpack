var mysql = require('mysql')
  , url = require('url')
  , Base = require('./mysql-base')
  , regex = require('../lib/regex')

var Badge = function (data) {
  this.data = data;
  this.prepare = {
    body: function (v) { return JSON.stringify(v); }
  }
  this.validators = {
    'type': function (v, data) {
      var valid = ['signed', 'hosted'];
      if (valid.indexOf(v) === -1) {
        return "Unknown type: " + v;
      }
      if (v === 'hosted' && !data.endpoint) {
        return "If type is hosted, endpoint must be set";
      }
      if (v === 'signed' && !data.jwt) {
        return "If type is signed, jwt must be set";
      }
    },
    'endpoint': function (v, data) {
      if (!v && data.type === 'hosted') {
        return "If type is hosted, endpoint must be set";
      }
    },
    'jwt': function (v, data) {
      if (!v && data.type === 'signed') {
        return "If type is signed, jwt must be set";
      }
    },
    'image_path': function (v) {
      if (!v) { return "Must have an image_path."; }
    },
    'body': function (v) {
      if (!v) { return "Must have a body."; }
      if (String(v) !== '[object Object]') { return "body must be an object"; }
    }
  }
}
Base.apply(Badge, 'badge');
Badge.validateBody = function (badge) {
  var err = new Error('Invalid badge assertion');
  err.fields = {};
  if (!badge.recipient) {
    err.fields['recipient'] = 'missing email address for `recipient`';
  }
  if (badge.recipient && !regex.email.test(badge.recipient)) {
    err.fields['recipient'] = 'invalid email for `recipient`';
  }
  if (badge.evidence && !regex.url.test(badge.evidence)) {
    err.fields['evidence'] = 'invalid url for `evidence`';
  }
  if (badge.expires && !regex.date.test(badge.expires)) {
    err.fields['expires'] = 'invalid date for `expires`';
  }
  if (Object.keys(err.fields).length) { return err; }
  return null;
}
module.exports = Badge;