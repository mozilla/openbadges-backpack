var mysql = require('../lib/mysql');
var regex = require('../lib/regex');
var crypto = require('crypto');
var Base = require('./mysql-base');
const utils = require('../lib/utils');

function sha256(value) {
  var sum = crypto.createHash('sha256');
  sum.update(value);
  return sum.digest('hex');
}


function isObject(thing) {
  return Object.prototype.toString.call(thing) === '[object Object]';
}

var Badge = function (attributes) {
  this.attributes = attributes;
};

Base.apply(Badge, 'badge');

Badge.prototype.presave = function () {
  if (!this.get('id')) {
    this.set('body_hash', Badge.createHash(this.get('body')));
  }
};

Badge.createHash = function createHash(body) {
  return sha256(JSON.stringify(body));
};

Badge.confirmRecipient = function confirmRecipient(assertion, email) {
  // can't validate if not given an assertion
  if (!assertion)
    return false;

  const recipient = isObject(assertion.recipient)
    ? assertion.recipient.identity
    : assertion.recipient
  const salt = isObject(assertion.recipient)
    ? assertion.recipient.salt || ''
    : assertion.salt || ''

  if (!recipient || !email)
    return false;

  if (typeof recipient !== 'string')
    return false

  // if it's an email address, do a straight comparison
  if (/@/.test(recipient))
    return recipient === email;

  // if it's not an email address, it must have an alg and dollar sign.
  if (!(recipient.match(/\w+(\d+)?\$.+/)))
    return false;

  const parts = recipient.split('$');
  const algorithm = parts[0];
  const expect = parts[1];
  var hasher;
  try {
    hasher = crypto.createHash(algorithm);
  } catch(e) {
    // #TODO: should probably actually throw an error here.
    return false;
  }

  // if there are more than 2 parts, it's an algorithm with options
  // #TODO: support algorithms with options, throw instead of just
  //   returning false here.
  if (parts.length !== 2)
    return false;

  const value = hasher.update(email + salt).digest('hex');
  return value.toLowerCase() === expect.toLowerCase();
};

Badge.prototype.share = function share(callback) {
  if (this.get('public_path'))
    return callback(null, this);

  this.presave();
  this.set('public_path', this.get('body_hash'));
  this.save(callback);
};

Badge.prototype.confirmRecipient = function confirmRecipient(email) {
  return Badge.confirmRecipient(this.get('body'), email);
};


Badge.prototype.checkHash = function checkHash() {
  return sha256(JSON.stringify(this.get('body'))) === this.get('body_hash');
};

Badge.prototype.getFromAssertion = function getFromAssertion(dotstring) {
  const parts = dotstring.split('.');
  const last = parts.pop();
  const obj = parts.reduce(function (obj, field) {
    if (!obj) return undefined;
    return obj[field];
  }, this.get('body'));
  return obj && obj[last];
};

// Validators called by `save()` (see mysql-base) in preparation for saving.
// A valid pass returns nothing (or a falsy value); an invalid pass returns a
// message about why a thing was invalid.

// #TODO: return either null or Error objects with more information about
// what's going on.

// TODO: make these errors more than strings so we don't have to parse
// them to figure out how to handle the error
Badge.validators = {
  body: function (value) {
    if (!value)
      return "Must have a body.";
    if (String(value) !== '[object Object]')
      return "body must be an object";
  }
};

Badge.findByUrl = function (url, callback) {
  Badge.findOne({public_path: url}, callback);
};

// Prepare a field as it goes into or comes out of the database.
Badge.prepare = {
  'in': { body: function (value) { return JSON.stringify(value); } },
  'out': {
    body: function (value) {
      return JSON.parse(value);
    },
    imageUrl: function (value, attr) {
      return utils.fullUrl('/images/badge/' + attr['body_hash'] + '.png');
    },
  }
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

  var internalClass = Object.prototype.toString.call(body);
  if (!body || internalClass !== '[object Object]') {
    err.message = 'Invalid badge assertion: invalid body';
    return err
  }

  function fieldFromDottedString (str, obj) {
    var fields = str.split('.');
    var current = obj;
    var previous = null;
    fields.forEach(function (f) {
      previous = current;
      current = current[f];
    });
    return previous[fields.pop()];
  }

  var test = {
    missing: function (fieldStr) {
      var field = fieldFromDottedString(fieldStr, body);
      if (!field) {
        err.fields[fieldStr] = 'missing required field: `' + fieldStr + '`';
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
      test.regexp('badge.issuer.origin', 'origin');
      test.regexp('badge.issuer.contact', 'email');
      test.length('badge.issuer.org', 128);
      test.length('badge.issuer.name', 128);
    }
  }
  if (Object.keys(err.fields).length) { return err; }
  return null;
};

// callback has the signature callback(err, {totalPerIssuer: ['issuer':1], totalBadges:1})
Badge.stats = function (callback) {
  var totalBadges = 0;
  var issuers = {};
  Badge.findAll(function(err, badges) {
    if (err) {
      return callback(err);
    }
    totalBadges = badges.length;
    badges.forEach(function (badge) {
      var assertion = badge.get('body').badge;
      if (!assertion.issuer) return;

      var name = assertion.issuer.name;
      var url = assertion.issuer.origin;

      issuers[url] = issuers[url] || { name: name, total: 0 };
      issuers[url].total++;
    });

    var urls = Object.keys(issuers);
    var totalPerIssuer = urls.map(function (url) {
      var issuer = issuers[url];
      return { url: url, total: issuer.total, name: issuer.name }
    });
    totalPerIssuer.sort(function(issuer1, issuer2) {
      return issuer2.total - issuer1.total
    });
    return callback(null, {totalPerIssuer: totalPerIssuer, totalBadges: totalBadges} );
  });
}

module.exports = Badge;
