var client = require('../lib/mysql').client;

var Base = function() { }

Base.apply = function (Model, table) {
  Model.fromDbResult = function (data) {
    if (data === undefined) {
      return null;
    }
    Object.keys(data).forEach(function (key) {
      if (key in Model.prepare.out) {
        data[key] = Model.prepare.out[key](data[key]);
      }
    });
    return new Model(data);
  }
  
  Model.find = function(criteria, callback) {
    var finders = Model.finders
      , keys = Object.keys(criteria)
      , firstKey = keys[0]
      , values = keys.map(function (key) { return criteria[key] })
      , qstring = 'SELECT * FROM `' + table + '` WHERE ' + keys.map(function (key) { return (key + ' = ?')}).join(' AND '); 
    var parseResults = function (err, results) {
      if (err) { callback(err); }
      else callback(null, results.map(Model.fromDbResult));
    };
    if (keys.length == 1 && firstKey in finders) {
      return Model.finders[firstKey](criteria[firstKey], parseResults)
    }
    client.query(qstring, values, parseResults);
  }
  
  Model.findById = function (id, callback) {
    Model.find({id: id}, function (err, results) {
      if (err) callback(err);
      callback(null, results.pop());
    })
  }
  
  Model.prototype = new Base;
  Model.prototype.client = client;
  Model.prototype.getTableName = function () { return table };
  Model.prototype.model = Model;
}
  
Base.prototype.validate = function (data) {
  var err = new Error('Invalid data')
    , validators = this.model.validators || {};
  data = (data || this.data);
  err.fields = {};
  Object.keys(validators).forEach(function (field) {
    var msg = validators[field](data[field], data);
    if (msg) { err.fields[field] = msg; } 
  })
  if (Object.keys(err.fields).length > 0) {
    return err;
  }
}

Base.prototype.save = function (callback) {
  var self = this
    , data = this.data
    , table = this.getTableName()
    , err = this.validate(data)
    , model = this.model;
  
  if (err) { return callback(err, null); }
  
  Object.keys(data).forEach(function (key) {
    if (key in model.prepare.in) {
      data[key] = model.prepare.in[key](data[key]);
    }
  });
  
  client._upsert(table, data, function (err, result) {
    if (err) { return callback(err, null); }
    if (!data.id && result.insertId) { data.id = result.insertId ; }
    return callback(null, self);
  })
}

module.exports = Base;