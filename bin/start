#!/usr/bin/env node
var spawn = require('child_process').spawn;
var colors = require('colors');
var http = require('http');
var program = require('commander');
var qs = require('querystring');
var fs = require('fs');
var util = require('util');

program
  .version('0.5.0')
  .option('-e, --env [env]', 'run under specified environment')
  .option('-f, --pidfile [file]', 'save a pidfile')
  .parse(process.argv);

var restarts = 0;
var runningServer;

function log () {
  var args = [].slice.call(arguments);
  args.unshift('runner'.magenta);
  console.log.apply(console, args);
};

function inspect (thing) {
  return util.inspect(thing, undefined, undefined, true);
}

var spawnServer = function () {
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
    runningServer = spawnServer();
  });

  return app;
};

process.on('SIGHUP', function () {
  // crash the server
  runningServer.kill();
})
;
process.on('SIGINT', (function (timeout) {
  var seriously = 0;
  return function () {
    if (seriously) process.exit();
    seriously = true;
    setTimeout(function () {
      seriously = false
    }, timeout);
  }
})(1000));

process.on('exit', function () {
  if (pidfile) {
    log('destroying pidfile', pidfile.bold);
    try {
      fs.unlinkSync(pidfile);
    } catch (err) {
      console.log('couldn\'t destroy pidfile:', inspect(err));
    }
  }
});

var pidfile = program.pidfile;
if (program.env)
  process.env['NODE_ENV'] = program.env;

if (pidfile) {
  log('saving pid to', pidfile.bold);
  fs.writeFileSync(pidfile, process.pid.toString())
}

log('runner pid is', process.pid.toString().bold);
runningServer = spawnServer();

// reduce restart count every 5 seconds
setInterval(function () {
  if (restarts > 0) restarts--;
}, 5000);

