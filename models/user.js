var mysql = require('../lib/mysql')

var User = function(data){
  this.fields = ['id', 'email', 'passwd', 'last_login', 'active'];
  this.data = data;
  this.client = mysql.client;
}

User.prototype.save = function(callback) {
  var data = this.data
    , client = this.client
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
User.prototype.saved = false;
User.findOrCreate = function() {  }
User.find = function(criteria) {  }

User._table = 'user';

var Collection = function(data){
  this.data = data;
}

module.exports = User;

// mysql.useTestDatabase();

/* 
 user = User.find({email: 'whaaaat'})
 user.collections() -> [
   Collection({ name: 'what', badges: [Badge(...), Badge(...)], user: User(...)})
 ]

*/
