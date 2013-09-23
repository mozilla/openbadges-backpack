var app = require('../../app'),
    statsd = require('../../lib/statsd'),
    test = require('tap').test;
    spawn = require('child_process').spawn;

const PHANTOMJS = 'phantomjs' || process.env['PHANTOMJS'];
const PHANTOMJS_NOT_FOUND_ERR = 
  'phantomjs not found. please install it from ' +
  'http://phantomjs.org/, or set the ' +
  'PHANTOMJS environment variable to its absolute path.';

function log(msg) {
  process.stderr.write(msg);
}

function loggedSpawn(command, args, options) {
  var process = spawn(command, args, options);
  process.stdout.setEncoding('utf8');
  process.stderr.setEncoding('utf8');
  process.stdout.on('data', log);
  process.stderr.on('data', log);
  return process;
}

function start(path, cb) {
  app.listen(0, function() {
    var url = 'http://localhost:' + app.address().port + path;
    var args = [__dirname + '/phantom-qunit.js', url];
    var cmdline = PHANTOMJS + ' ' + args.join(' ');
    var phantom = loggedSpawn(PHANTOMJS, args);

    log('running browser-based tests at ' + url + ' using phantomjs.');
    phantom.on('exit', function(status) {
      app.close();
      statsd.socket.close();
      if (status != 0)
        throw new Error('process "' + cmdline + '" exited with status ' +
                        status);
      if (cb) cb();
    });
  });
}

exports.runQunitTests = function(path, cb) {
  if ('PHANTOMJS' in process.env)
    start(path, cb);
  else
    spawn('which', [PHANTOMJS]).on('exit', function(status) {
      if (status) throw new Error(PHANTOMJS_NOT_FOUND_ERR);
      start(path, cb);
    });
};

exports.testRunner = function(path) {
  return function(t) {
    exports.runQunitTests(path, function() {
      t.ok(true, 'all qunit tests in ' + path + ' pass');
      t.end();
    });
  };
};

exports.details = function() {
  return {
    skip: ('DISABLE_PHANTOM_TESTS' in process.env)
  };
};
