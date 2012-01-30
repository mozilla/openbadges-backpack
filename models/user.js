var crypto = require('crypto'),
    bcrypt = require('bcrypt'),
    regex = require('../lib/regex'),
    mysql = require('../lib/mysql'),
    Base = require('./mysql-base');

var User = function (data) {
  var ALGO = 'bcrypt';
  this.data = data;
  
  if (!data.id && data.passwd) {
    data.salt = User.makeSalt();
    data.passwd = User.pw[ALGO].hash(data.passwd, data.salt)
  }
  
  this.changePassword = function (newPassword) {
    var salt = this.data.salt = User.makeSalt();
    this.data.passwd = User.pw[ALGO].hash(newPassword, salt);
  };
  
  this.checkPassword = function (given) {
    var parts = this.data.passwd.split('$')
      , algo = parts.shift()
      , hash = parts.join('$');
    return User.pw[algo].check(given, this.data.salt, hash);
  };
  
  this.setLoginDate = function () {
    this.data.last_login = Math.floor(Date.now()/1000);
  };
}
Base.apply(User, 'user');

User.makeSalt = function () { return crypto.randomBytes(16) + ''; } 

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
