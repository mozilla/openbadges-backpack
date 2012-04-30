#!/usr/bin/env node
var spawn = require('child_process').spawn;
var colors = require('colors');
var http = require('http');
var program = require('commander');
var qs = require('querystring');

program
  .version('0.5.0')
  .option('-p, --port [port]', 'Run a webhook server on specified port')
  .option('-b, --branch [branch]', 'Only watch for changes on specified branch [master]', 'master')
  .option('-e, --env [env]', 'Run under specified environment')
  .parse(process.argv);

var restarts = 0;
var running_server;
var log = function () {
  console.log("runner: ".magenta + Array.prototype.slice.call(arguments).join(' '));
};

var spawn_server = function () {
  var app, fancypid;
  if (++restarts > 5) {
    log('too many failures, shut. down. everything.');
    process.exit();
  }

  log('spawning new server');
  app = spawn('node', ['app.js']);
  fancypid = ('(' + app.pid + ') ').grey;

  app.stdout.on('data', function (data) {
    process.stdout.write(fancypid);
    process.stdout.write(data);
  });
  
  app.stderr.on('data', function (data) {
    process.stderr.write(fancypid);
    process.stderr.write(data);
  });
  
  app.on('exit', function (code, sig) {
    if (sig) log('server killed with signal ' + sig);
    if (code) log('server exited with code ' + code);
    running_server = spawn_server();
  });

  return app;
};

var webhook_server = function (port, branch) {
  log('starting webhook server on port', port);
  log('watching for changes on', branch, 'branch');
  http.createServer(function (req, resp) {
    var commitData = '';
    req.on('data', function (incoming) { commitData += incoming });
    req.on('end', function () {
      var commit, payload;
      resp.end('okay');
      try {
        payload = qs.parse(commitData)['payload'];
        commit = JSON.parse(payload);
      } catch (e) {
        log('ignoring illegal webhook attempt from', req.client.remoteAddress);
        return;
      }
      if (commit.ref.match('refs/heads/' + branch)) {
        log('new deploy at ' + (new Date()).toGMTString());
        pull_new_code(function () { running_server.kill() });
      }
    });
  }).listen(port);
};

var pull_new_code = function (callback) {
  var git = spawn('git', ['pull', 'deploy', 'master']);
  var preface = 'git '.magenta;
  
  git.stdout.on('data', function (data) {
    process.stdout.write(preface);
    process.stderr.write(data);
  });
  
  git.stderr.on('data', function (data) {
    process.stderr.write(preface);
    process.stderr.write(data);
  });
  
  git.on('exit', function (code, sig) {
    if (code === 0) install_new_modules(callback);
  });
};

var install_new_modules = function (callback) {
  var npm = spawn('npm', ['install']);
  var preface = 'npm '.magenta;
  
  npm.stdout.on('data', function (data) {
    process.stdout.write(preface);
    process.stderr.write(data);
  });
  
  npm.stderr.on('data', function (data) {
    process.stderr.write(preface);
    process.stderr.write(data);
  });
  
  npm.on('exit', function (code, sig) {
    if (code === 0) { callback(); }
  });
};

if (program.env) process.env['NODE_ENV'] = program.env;

log('pid:', process.pid);
running_server = spawn_server();

if (program.port && program.branch) {
  webhook_server(program.port, program.branch);
}

process.on('SIGHUP', function () {
  running_server.kill();
});

var srs = 0;
process.on('SIGINT', function () {
  if (srs) process.exit();
  srs = 1;
  setTimeout(function () { srs = 0 }, 1000);
});

// reduce restart count.
setInterval(function () { if (restarts > 0) restarts--; }, 5000);
