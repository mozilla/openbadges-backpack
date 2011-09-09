#!/usr/bin/env node
var spawn = require('child_process').spawn
  , colors = require('colors')
  , http = require('http')
  , program = require('commander')

program
  .version('0.5.0')
  .option('-p, --port [port]', 'Run a webhook server on specified port')
  .option('-b, --branch [branch]', 'Only watch for changes on specified branch [master]', 'master')
  .parse(process.argv)

var restarts = 0;
var running_server;
var log = function() {
  console.log("runner: ".magenta + Array.prototype.slice.call(arguments).join(' '));
}

var spawn_server = function(){
  var app, fancypid;
  if (++restarts > 5) {
    log('too many failures, shut. down. everything.');
    process.exit();
  }
  
  log('spawning new server');
  app = spawn('node', ['app.js']);
  fancypid = ('('+app.pid+') ').grey;

  app.stdout.on('data', function(data){
    process.stdout.write(fancypid);
    process.stdout.write(data);
  })
  app.stderr.on('data', function(data){
    process.stderr.write(fancypid);
    process.stderr.write(data);
  })
  app.on('exit', function(code, sig) {
    if (sig) log('server killed with signal ' + sig);
    if (code) log('server exited with code ' + code);
    running_server = spawn_server();
  })
  
  return app;
}
var webhook_server = function(port, branch) {
  log('starting webhook server on port', port)
  log('watching for changes on', branch, 'branch');
  http.createServer(function(req, resp){
    req.on('data', function(incoming){
      var commitData;
      try { commitData = JSON.parse(incoming); }
      catch(e) {
        log('ignoring illegal webhook attempt from', req.client.remoteAddress);
        return;
      }
      if (commitData.ref.match('refs/heads/' + branch)) {
        pull_new_code(function(){ running_server.kill(); })
      }
    })
    req.on('end', function(){ resp.end('okay');})
 }).listen(port);
}

var pull_new_code = function(callback){
  var git = spawn('git', ['pull', 'deploy', 'master']);
  var preface = 'git '.magenta
  git.stdout.on('data', function(data){
    process.stdout.write(preface);
    process.stderr.write(data);
  })
  git.stderr.on('data', function(data){
    process.stderr.write(preface);
    process.stderr.write(data);
  })
  git.on('exit', function(code, sig){
    if (code === 0) { callback(); }
  })
}

log('pid:', process.pid);
running_server = spawn_server();

if (program.port && program.branch) {
  webhook_server(program.port, program.branch);
}

process.on('SIGHUP', function () {
  running_server.kill();
});

// reduce restart count.
setInterval(function(){ if (restarts > 0) restarts--; }, 1000);
