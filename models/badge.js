var mysql = require('../lib/mysql')
  , url = require('url')
  , Base = require('./mysql-base')
  , regex = require('../lib/regex')

var Badge = function (data) { this.data = data; }
Base.apply(Badge, 'badge');

// Validators called by `save()` (see mysql-base) in preparation for saving.
// A valid pass returns nothing (or a falsy value); an invalid pass returns a
// message about why a thing was invalid.
Badge.validators = {
  type: function (value, data) {
    var valid = ['signed', 'hosted'];
    if (valid.indexOf(value) === -1) {
      return "Unknown type: " + value;
    }
    if (value === 'hosted' && !data.endpoint) {
      return "If type is hosted, endpoint must be set";
    }
    if (value === 'signed' && !data.jwt) {
      return "If type is signed, jwt must be set";
    }
    if (value === 'signed' && !data.public_key) {
      return "If type is signed, public_key must be set";
    }
  },
  endpoint: function (value, data) {
    if (!value && data.type === 'hosted') {
      return "If type is hosted, endpoint must be set";
    }
  },
  jwt: function (value, data) {
    if (!value && data.type === 'signed') {
      return "If type is signed, jwt must be set";
    }
  },
  public_key: function (value, data) {
    if (!value && data.type === 'signed') {
      return "If type is signed, public_key must be set";
    }
  },
  image_path: function (value) {
    if (!value) { return "Must have an image_path."; }
  },
  body: function (value) {
    if (!value) { return "Must have a body."; }
    if (String(value) !== '[object Object]') { return "body must be an object"; }
    if (Badge.validateBody(value) instanceof Error) { return "invalid body"; }
  }
};

// Prepare a field as it goes into or comes out of the database.
Badge.prepare = {
  in: { body: function (v) { return JSON.stringify(v); } },
  out: { body: function (v) { return JSON.parse(v); } }
};

// Virtual finders. By default, `find()` will take the keys of the criteria
// and create WHERE statements based on those. This object provides more
// nuanced control over how the query is formed and also allows creation
// of finders that don't map directly to a column name.
Badge.finders = {
  email: function (value, callback) {
    var query = "SELECT * FROM `badge` WHERE `user_id` = (SELECT `id` FROM `user` WHERE `email` = ?)";
    mysql.client.query(query, [value], callback);
  }
};
Badge.validateBody = function (body) {
  var err = new Error('Invalid badge assertion');
  err.fields = {};
  
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
  };
  
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