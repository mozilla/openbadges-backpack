var crypto = require('crypto');
var regex = require('../lib/regex');
var mysql = require('../lib/mysql');
var Base = require('./mysql-base');
var Badge = require('./badge');

var User = function (attributes) {
  this.attributes = attributes;
  this.setLoginDate = function () {
    this.set('last_login', Math.floor(Date.now() / 1000));
  };
};

Base.apply(User, 'user');

User.prototype.getAllBadges = function(callback) {
  Badge.find({email: this.get('email')}, function(err, badges) {
    if (!err && badges) {
      // There doesn't appear to be a way to do this at the SQL level :(
      badges.sort(function(a, b) {
        var aid = a.get('id'),
            bid = b.get('id');
        if (aid == bid) return 0;
        return bid - aid;
      });
    }

    callback(err, badges);
  });
}

User.prototype.getLatestBadges = function(count, callback) {
  if (typeof count == 'function') {
    callback = count;
    count = 7; // Yay for magic numbers!
  }

  this.getAllBadges(function(err, badges) {
    if (!err && badges) {
      // There doesn't appear to be a way to do this at the SQL level :(
      badges = badges.slice(0,count);
    }

    callback(err, badges);
  });
}

User.findOrCreate = function (email, callback) {
  var newUser = new User({ email: email });
  User.findOne({ email: email }, function (err, user) {
    if (err) { return callback(err); }
    if (user) { return callback(null, user); }
    else { return newUser.save(callback); }
  });
};

User.validators = {
  email: function (value) {
    if (!regex.email.test(value)) { return "invalid value for required field `email`"; }
  }
};

// callback has the signature (err, numberOfUsers)
User.totalCount = function (callback) {
  User.findAll(function(err, users) {
    if (err) {
      return callback(err, null);
    }
    return callback(null, users.length);
  })
}

module.exports = User;
