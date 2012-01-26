var mysql = require('../lib/mysql')
  , crypto = require('crypto')
  , bcrypt = require('bcrypt')
  , Base = require('./mysql-base');

var User = function (data) {
  var ALGO = 'bcrypt';
  if (!data.id) {
    data.salt = User.makeSalt();
    data.passwd = User.pw[ALGO].hash(data.passwd, data.salt)
  }
  this.data = data;
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
}
Base.apply(User, 'user');

User.makeSalt = function () { return crypto.randomBytes(16) + ''; } 

User.pw = {bcrypt: {
  hash: function (pw, salt) {
    var saltedpw = pw + salt;
    return 'bcrypt$' + bcrypt.hashSync(saltedpw, bcrypt.genSaltSync(10));
  },
  check: function (pw, salt, hash) {
    var saltedpw = pw + salt;
    return bcrypt.compareSync(saltedpw, hash);
  }
}};
module.exports = User;
