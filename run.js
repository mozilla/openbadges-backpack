#!/usr/bin/env node
var spawn = require('child_process').spawn
  , colors = require('colors')

var running_server;
var log = function() {
  console.log("runner: ".magenta + Array.prototype.slice.call(arguments).join(' '));
}

var create_server = function(){
  log('spawning new server');
  var app = spawn('node', ['app.js']);
  var fancypid = ('('+app.pid+') ').grey;

  app.stdout.on('data', function(data){
    process.stdout.write(fancypid);
    process.stdout.write(data);
  })
  app.stderr.on('data', function(data){
    process.stdout.write(fancypid);
    process.stdout.write(data);
  })
  app.on('exit', function(code, sig) {
    if (sig) log('caught signal '+sig)
    if (code) log('exited with code '+code)
    running_server = create_server();
  })
  return app;
}
process.on('SIGHUP', function () {
  // should restart itself
  running_server.kill();
});

log('parent pid:', process.pid);
running_server = create_server();
