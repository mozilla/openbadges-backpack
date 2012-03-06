var mysql = require('../lib/mysql')
  , regex = require('../lib/regex')
  , crypto = require('crypto')
  , Base = require('./mysql-base');

var sha256 = function (value) {
  var sum = crypto.createHash('sha256')
  sum.update(value);
  return sum.digest('hex');
};

var Badge = function (attributes) {
  this.attributes = attributes;
};

Base.apply(Badge, 'badge');

Badge.prototype.presave = function () {
  if (!this.get('id')) {
    this.set('body_hash', sha256(this.get('body')));
  }
};

Badge.prototype.checkHash = function () {
  return sha256(JSON.stringify(this.get('body'))) === this.get('body_hash');
};

// Validators called by `save()` (see mysql-base) in preparation for saving.
// A valid pass returns nothing (or a falsy value); an invalid pass returns a
// message about why a thing was invalid.

// #TODO: return either null or Error objects with more information about
// what's going on.

// TODO: make these errors more than strings so we don't have to parse
// them to figure out how to handle the error
Badge.validators = {
  type: function (value, attributes) {
    var valid = ['signed', 'hosted'];
    if (valid.indexOf(value) === -1) {
      return "Unknown type: " + value;
    }
    if (value === 'hosted' && !attributes.endpoint) {
      return "If type is hosted, endpoint must be set";
    }
    if (value === 'signed' && !attributes.jwt) {
      return "If type is signed, jwt must be set";
    }
    if (value === 'signed' && !attributes.public_key) {
      return "If type is signed, public_key must be set";
    }
  },
  endpoint: function (value, attributes) {
    if (!value && attributes.type === 'hosted') {
      return "If type is hosted, endpoint must be set";
    }
  },
  jwt: function (value, attributes) {
    if (!value && attributes.type === 'signed') {
      return "If type is signed, jwt must be set";
    }
  },
  public_key: function (value, attributes) {
    if (!value && attributes.type === 'signed') {
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
  in: { body: function (value) { return JSON.stringify(value); } },
  out: { body: function (value) { return JSON.parse(value); } }
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

// Validate the structure and values of the body field, which contains the 
// badge assertion as received from the issuer. Returns an error object with a
// `fields` attribute describing the errors if invalid, and `undefined` if
// valid.
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
  test.regexp('recipient', 'emailOrHash');
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
