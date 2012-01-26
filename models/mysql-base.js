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

Base.prototype.save = function (callback) {
  var self = this
    , data = this.data
    , table = this.getTableName()
    , err = (this.validate || function(){return;})(data);
  
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