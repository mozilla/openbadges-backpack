var crypto = require('crypto');
var regex = require('../lib/regex');
var mysql = require('../lib/mysql');
var Base = require('./mysql-base');
var Badge = require('./badge');
var bcrypt   = require('bcrypt-nodejs');

var User = function (attributes) {
  this.attributes = attributes;
  this.setLoginDate = function () {
    this.set('last_login', new Date().getTime());
  };
  this.validPassword = function(password) {
    if ((this.attributes.password == '') || (this.attributes.password == null))
      return false;

    return bcrypt.compareSync(password, String(this.attributes.password));
  };
};

Base.apply(User, 'user');

User.prototype.generateHash = function(password) {
  // generating a hash
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

User.prototype.getAllBadges = function(callback) {
  Badge.find({user_id: this.get('id')}, function(err, badges) {
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
    count = 11; // Yay for magic numbers!
  }

  this.getAllBadges(function(err, badges) {
    if (!err && badges) {
      // There doesn't appear to be a way to do this at the SQL level :(
      badges = badges.slice(0,count);
    }

    // this sits as a placeholder for the upload badge addition on recent badges page
    var uploadBadge = { recent: true };

    badges.unshift(uploadBadge);

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
