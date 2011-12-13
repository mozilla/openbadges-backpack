var mysql = require('../lib/mysql')
  , client = mysql.client;

var User = function(data){
  this.data = data;
}

User.prototype.save = function() { }
User.prototype.destroy = function() { }
User.prototype.collections = function() { }
User.prototype.createCollection = function(data) { }
User.prototype.saved = false;
User.findOrCreate = function() {  }
User.find = function(criteria) {  }

var Collection = function(data){
  this.data = data;
}


// mysql.useTestDatabase();

/* 
 user = User.find({email: 'whaaaat'})
 user.collections() -> [
   Collection({ name: 'what', badges: [Badge(...), Badge(...)], user: User(...)})
 ]

*/
