var crypto = require('crypto'),
    bcrypt = require('bcrypt'),
    regex = require('../lib/regex'),
    mysql = require('../lib/mysql'),
    Base = require('./mysql-base');

var User = function (attributes) {
  var ALGO = 'bcrypt';
  this.attributes = attributes;
  
  if (!attributes.id && attributes.passwd) {
    attributes.salt = User.makeSalt();
    attributes.passwd = User.pw[ALGO].hash(attributes.passwd, attributes.salt)
  }
  
  this.changePassword = function (newPassword) {
    var salt = this.attributes.salt = User.makeSalt();
    this.set('passwd', User.pw[ALGO].hash(newPassword, salt));
  };
  
  this.checkPassword = function (given) {
    if (!this.attributes.passwd) { return false; }
    var parts = this.get('passwd').split('$')
      , algo = parts.shift()
      , hash = parts.join('$');
    return User.pw[algo].check(given, this.get('salt'), hash);
  };
  
  this.setLoginDate = function () {
    this.set('last_login', Math.floor(Date.now()/1000));
  };
}
Base.apply(User, 'user');

User.makeSalt = function () { return crypto.randomBytes(16) + ''; } 

User.findOrCreate = function (email, callback) {
  var newUser = new User({email: email});
  User.findOne({email: email}, function (err, user) {
    if (err) { return callback(err); }
    if (user) { return callback(null, user); }
    else { return newUser.save(callback); }
  })
}

User.pw = {bcrypt: {
  hash: function (pw, salt) {
    var rounds = 10;
    var saltedpw = pw + salt;
    return 'bcrypt$' + bcrypt.hashSync(saltedpw, bcrypt.genSaltSync(rounds));
  },
  check: function (pw, salt, hash) {
    var saltedpw = pw + salt;
    return bcrypt.compareSync(saltedpw, hash);
  }
}};

User.validators = {
  email: function (value) {
    if (!regex.email.test(value)) { return "invalid value for required field `email`"; }
  }
}

module.exports = User;
