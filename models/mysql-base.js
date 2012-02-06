var client = require('../lib/mysql').client;

var Base = function() { };

Base.apply = function (Model, table) {
  Model.fromDbResult = function (data) {
    if (data === undefined) {
      return null;
    }
    Object.keys(data).forEach(function (key) {
      var prep = (Model.prepare || {})['out'] || {}
      if (key in prep) {
        data[key] = Model.prepare.out[key](data[key]);
      }
    });
    return new Model(data);
  };
  
  Model.findAll = function(callback) {
    client.query('SELECT * FROM ' + table, function (err, results) {
      if (err) { callback(err); }
      else callback(null, results.map(Model.fromDbResult));
    });
  };
  
  Model.find = function(criteria, callback) {
    var finders = Model.finders || {}
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
  };
  
  Model.findOne = function (criteria, callback) {
    Model.find(criteria, function (err, results) {
      if (err) callback(err);
      callback(null, results.pop());
    })
  };
  
  Model.findById = function (id, callback) {
    Model.findOne({id: id}, callback);
  };
  
  Model.prototype = new Base;
  Model.prototype.model = Model;
  Model.prototype.client = client;
  Model.prototype.getTableName = function () { return table };
  Model.prototype.set = function (key, value) { this.data[key] = value; return this; };
  Model.prototype.get = function (key) { return this.data[key]; };
};
  
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
};

Base.prototype.save = function (callback) {
  var data = this.data
    , table = this.getTableName()
    , err = this.validate(data)
    , model = this.model
    , prepMethods = (model.prepare || {})['in'] || {};
  
  callback = callback || function(){};
  if (err) { return callback(err, null); }
  
  Object.keys(data).forEach(function (key) {
    var prep = prepMethods[key]
    if ( prep ) {
      data[key] = prep(data[key], data);
    }
  });
  
  if ('function' === typeof this.presave) {
    this.presave();
  }
  
  var parseResult = function (err, result) {
    if (err) { return callback(err, null); }
    if (!data.id && result.insertId) { data.id = result.insertId ; }
    return callback(null, this);
  };
  
  client._upsert(table, data, parseResult.bind(this))
};

Base.prototype.destroy = function (callback) {
  var self = this
    , data = this.data
    , table = this.getTableName()
    , querySQL = 'DELETE FROM `'+table+'` WHERE `id` = ? LIMIT 1;'
  client.query(querySQL, [data.id], function (err, resp) {
    if (err) { return callback(err); }
    delete data.id;
    return callback(null, self);
  });
};

module.exports = Base;