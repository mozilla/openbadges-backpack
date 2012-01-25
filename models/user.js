var mysql = require('../lib/mysql')
  , crypto = require('crypto')
var Base = require('./mysql-base')

var User = function(data) {
  this._collections = [];
  this.fields = ['id', 'email', 'passwd', 'last_login', 'active'];
  this.data = data;
  if (data.id) this.getCollectionsFromDb();
}

Base.apply(User, 'user');

User.prototype.save = function (callback) {
  var data = this.data
    , table = this.getTableName()
    , self = this;
  this.client._upsert(table, data, function (err, result) {
    if (err) return callback(err, null);
    if (!data.id && result.insertId) self.data.id = result.insertId;
    
    // #FIXME: all of the collection saves are async -- the main callback will
    // be triggered before the collection saves are complete. we should wait
    // until the last collection save finishes, check for errors, then fire
    // the main callback.
    var errPass = function (err, resp) {if (err) callback(err) }
    self.collections().forEach(function (c) { c.save(errPass) })
    
    return callback(null, self);
  })
}

User.prototype.collections = function() {
  return this._collections;
}
User.prototype.getCollectionsFromDb = function () {
  var self = this;
  Collection.find({user_id: this.data.id}, function (err, results) {
    console.dir(results);
  })
}
User.prototype.createCollection = function(name) {
  var coll = new Collection(this, {name: name});
  this._collections.push(coll);
  return coll;
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
  this.data.obfurl = this.generateUrl();
}
Base.apply(Collection, 'collection');

Collection.prototype.generateUrl = function () {
  var sum = crypto.createHash('sha1');
  sum.update((new Date).toString + this.user.data.email + this.data.name);
  return sum.digest('hex');
}
Collection.prototype.save = function (callback) {
  var data = this.data
    , table = this.getTableName()
    , self = this;
  
  this.data.user_id = this.user.data.id;
  
  this.client._upsert(table, data, function (err, result) {
    if (err) return callback(err, null);
    if (!data.id && result.insertId) data.id = result.insertId;
    return callback(null, self);
  })

}

User.Collection = Collection;
module.exports = User;
