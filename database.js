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
Collection.prototype.insert = function(data, callback) {
  this.command('insert', data, callback);
}

exports.collection = function(name) { return new Collection(name); }
exports.connection = conn;
