var configuration = require('../lib/configuration')
  , colors = require('colors');

// make sure we don't blow away the real dataabase
var oldDb = configuration.get('database').name;
var oldEnv = configuration.get('env');

process.env['NODE_ENV'] = 'test';
var testDb = configuration.get('database').name;
if (oldDb == testDb && oldEnv !== 'test') {
  throw ("Error: can't run test: test db is the same as " + oldEnv + ' db ('+ oldDb +')').red;
}

// wipe out collection from test database
var database = require('../database')
if (!(database.using === testDb)) throw "something went wrong, not using test db".red;
database.client.command('dropDatabase', function(){});
module.exports = require('vows');
