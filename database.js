var configuration = require('./lib/configuration')
  , mongo = require('mongodb')
  , conf = configuration.get('database')
  , EventEmitter = require('events').EventEmitter

var server = new mongo.Server(conf.host, conf.port, {});
var conn = new mongo.Db(conf.name, server, {})

// action buffer -- used to buffer commands before we open the connection
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

// open a connection to the database, flush all buffered commands
conn.open(function(err, client) {
  if (err) throw err;
  function execAction(action) { client.collection(action.collection, action);}
  // first flush buffer.
  actions.flush().forEach(execAction)
  // then listen on queues.
  actions.on('queue', execAction);
});

// make a really thin wrapper around collection methods
function Collection(name) { this.name = name; }
Collection.prototype.command = function() {
  var args = Array.prototype.slice.call(arguments)
    , command = args.shift();
  var act = function(err, col){
    if (err) throw err;
    col[command].apply(col, args);
  }
  act.collection = this.name;
  actions.push(act);
}
Collection.prototype.insert = function(data, opts, callback) {
  if ('function' === typeof opts) callback = opts, opts = {};
  this.command('insert', data, callback);
}
Collection.prototype.update = function(selector, data, opts, callback) {
  if ('function' === typeof opts) callback = opts, opts = {};
  this.command('update', selector, data, callback);
}
Collection.prototype.remove = function(selector, opts, callback) {
  if ('function' === typeof opts) callback = opts, opts = {};
  this.command('remove', selector, callback);
}
// `find` just had to go and be different, didn't it.
Collection.prototype.find = function(query, opts, callback) {
  if ('function' === typeof opts) callback = opts, opts = {};
  var act = function(err, col){
    if (err) throw err;
    col.find(query, opts).toArray(callback);
  }
  act.collection = this.name;
  actions.push(act);
}

exports.collection = function(name) { return new Collection(name); }
exports.connection = conn;
