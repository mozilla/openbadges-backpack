var mysql = require('../lib/mysql')
var Base = require('./mysql-base')

var User = function(data) {
  this.fields = ['id', 'email', 'passwd', 'last_login', 'active'];
  this.data = data;
}

Base.apply(User, 'user');

User.prototype.collections = function() { return 'lolllll' }
User.prototype.createCollection = function(name) {
  var data = {name: name};
  return new Collection(this, data);
}
User.findByEmail = function (email, callback) {
  User.find({email: email}, function (err, results) {
    if (err) callback(err);
    else callback(null, results.pop());
  })
}

var Collection = function(user, data) {
  this.user = user;
  this.data = data;
}
Base.apply(Collection, 'collection');


User.Collection = Collection;
module.exports = User;
