var mysql = require('../lib/mysql')
  , Base = require('./mysql-base');

var User = function (data) {
  this.data = data;
}

Base.apply(User, 'user');

module.exports = User;
