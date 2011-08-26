var configuration = require('./lib/configuration')
  , mongo = require('mongodb')
  , conf = configuration.get('database')
  , EventEmitter = require('events').EventEmitter

var server = new mongo.Server(conf.host, conf.port, {});
var conn = new mongo.Db(conf.name, server, {})

var actions = new EventEmitter();
actions.setMaxListeners(1);
actions.__buf = []
actions.push = function(act){
  this.__buf.push(act);
  this.emit('queue', act, this.__buf);
}
actions.flush = function(){
  var ret = this.__buf;
  this.__buf = []
  return ret;
}

conn.open(function(err, client) {
  if (err) throw err;
  function perform(action) {
    client.collection(action.collection, action);
  }
  // first flush buffer.
  actions.flush().forEach(function(action) {
    perform(action);
  })
  // then listen on queues.
  actions.on('queue', perform);
});

function Collection(name) { this.name = name; }
Collection.prototype.insert = function(data, callback){
  var collectionName = this.name;
  var act = function(err, col){
    if (err) throw err;
    col.insert(data, callback);
  };
  act.collection = this.name;
  actions.push(act);
}
exports.collection = function(name) { return new Collection(name); }
exports.connection = conn;
