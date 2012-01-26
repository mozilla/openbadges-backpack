var client = require('../lib/mysql').client;

var Base = function() { }

Base.apply = function (Model, table) {
  Model.fromDbResult = function (data) {
    if (data === undefined) return null;
    return new Model(data);
  }
  Model.find = function(criteria, callback) {
    var keys = Object.keys(criteria)
      , values = keys.map(function (k) { return criteria[k] })
    var qstring
      = 'SELECT * FROM `' + table + '` WHERE '
      + keys.map(function (k) { return (k + ' = ?')}).join(' AND ')
    client.query(qstring, values, function (err, results) {
      if (err) callback(err);
      else callback(null, results.map(Model.fromDbResult));
    });
  }
  Model.findById = function (id, callback) {
    Model.find({id: id}, function (err, results) {
      if (err) callback(err);
      callback(null, results.pop());
    })
  }
  Model.prototype = new Base;
  Model.prototype.super = function (method, args) { return Model.prototype[method].apply(this, args); }
  Model.prototype.client = client;
  Model.prototype.getTableName = function () { return table };
}
  
Base.prototype.validate = function (data) {
  var err = new Error('Invalid data')
    , validators = this.validators || {};
  data = (data || this.data);
  err.fields = {};
  Object.keys(validators).forEach(function (field) {
    var msg = validators[field](data[field], data);
    if (msg) { err.fields[field] = msg; } 
  })
  if (Object.keys(err.fields).length > 0) { return err; }
}

Base.prototype.save = function (callback) {
  var self = this
    , data = this.data
    , table = this.getTableName()
    , err = this.validate(data);
  
  if (err) { return callback(err, null); }
  
  Object.keys(data).forEach(function (k) {
    if (k in self.prepare) data[k] = self.prepare[k](data[k]);
  })
  
  client._upsert(table, data, function (err, result) {
    if (err) return callback(err, null);
    if (!data.id && result.insertId) data.id = result.insertId;
    return callback(null, self);
  })
}

module.exports = Base;