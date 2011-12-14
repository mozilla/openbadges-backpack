var mysql = require('../lib/mysql')

var User = function(data){
  this.fields = ['id', 'email', 'passwd', 'last_login', 'active'];
  this.data = data;
}

User.prototype.save = function(callback) {
  var data = this.data
    , client = User._client
    , self = this;
  
  client._upsert(User._table, data, function (err, result) {
    if (err) return callback(err, null);
    if (!data.id && result.insertId) data.id = result.insertId;
    return callback(null, self);
  })
  
}

User.prototype.destroy = function() { }
User.prototype.collections = function() { }
User.prototype.createCollection = function(data) { }

User.findOrCreate = function() {  }

User.fromDbResult = function (data) {
  if (data === undefined) return null;
  return new User(data);
}
User.find = function(criteria, callback) {
  var client = User._client
    , keys = Object.keys(criteria)
    , values = keys.map(function (k) { return criteria[k] })
  var qstring
    = 'SELECT * FROM `'+User._table+'` WHERE '
    + keys.map(function (k) { return (k + ' = ?')}).join(' AND ')
  client.query(qstring, values, function (err, results) {
    if (err) callback(err);
    else callback(null, results.map(User.fromDbResult));
  });
}
User.findById = function (id, callback) {
  User.find({id: id}, function (err, results) {
    if (err) callback(err);
    callback(null, results.pop());
  })
}
User.findByEmail = function (email, callback) {
  User.find({email: email}, function (err, results) {
    if (err) callback(err);
    else callback(null, results.pop());
  })
}

User._table = 'user';
User._client = mysql.client;

var Collection = function(data){
  this.data = data;
}

module.exports = User;
