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
      if (Badge.validateBody(v) instanceof Error) { return "invalid body"; }
    }
  }
}
Base.apply(Badge, 'badge');
Badge.validateBody = function (body) {
  var err = new Error('Invalid badge assertion');
  err.fields = {};
  
  // helpers
  var fieldFromDottedString = function (str, obj) {
    var fields = str.split('.')
      , current = obj
      , previous = null;
    fields.forEach(function (f) {
      previous = current;
      current = current[f];
    })
    return previous[fields.pop()];
  };
  
  var test = {
    missing: function (fieldStr) {
      var field = fieldFromDottedString(fieldStr, body);
      if (!field) {
        err.fields[fieldStr] = 'missing email address for `' + fieldStr + '`';
      }
    },
    regexp: function (fieldStr, type) {
      var field = fieldFromDottedString(fieldStr, body);
      if (field && !regex[type].test(field)) {
        err.fields[fieldStr] = 'invalid ' + type + ' for `' + fieldStr + '`';
      }
    },
    length: function (fieldStr, maxlength) {
      var field = fieldFromDottedString(fieldStr, body);
      if (field && field.length > maxlength) {
        err.fields[fieldStr] = 'invalid value for `' + fieldStr + '`: too long, maximum length should be ' + maxlength;
      }
    }
  }
  
  // begin tests
  test.missing('recipient');
  test.regexp('recipient', 'email');
  test.regexp('evidence', 'url');
  test.regexp('expires', 'date');
  test.regexp('issued_on', 'date');
  if (!body.badge) {
    err.fields['badge'] = 'missing required field `badge`';
  } else {
    test.missing('badge.version');
    test.missing('badge.name');
    test.missing('badge.description');
    test.missing('badge.criteria');
    test.missing('badge.image');
    test.regexp('badge.version', 'version');
    test.regexp('badge.image', 'url');
    test.regexp('badge.criteria', 'url');
    test.length('badge.name', 128);
    test.length('badge.description', 128);
    if (!body.badge.issuer) {
      err.fields['badge.issuer'] = 'missing required field `badge.issuer`';
    } else {
      test.missing('badge.issuer.origin');
      test.missing('badge.issuer.name');
      test.regexp('badge.issuer.origin', 'url');
      test.regexp('badge.issuer.contact', 'email');
      test.length('badge.issuer.org', 128);
      test.length('badge.issuer.name', 128);
    }
  }
  if (Object.keys(err.fields).length) { return err; }
  return null;
}
module.exports = Badge;