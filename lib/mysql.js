var path = require('path');
var mysql = require('mysql');
var async = require('async');
var migrate = require('db-migrate');
var conf = require('../lib/configuration').get('database');
var client = mysql.createClient(conf);
var testDb = "`test_" + conf.database + "`";
var usingTestDb = false;
var dbEncoding = 'utf8';

exports.migrations = {
  dir: path.resolve(__dirname, '..', 'migrations'),
  up: function(options, callback) {
    if (arguments.length == 1) {
      callback = options;
      options = {};
    }
    options.config = options.config || exports.getDatabaseConfig();
    options.count = options.count || Number.MAX_VALUE;
    migrate.connect(options.config, function(err, migrator) {
      if (err) throw err;
      migrator.migrationsDir = exports.migrations.dir;
      migrator.driver.createMigrationsTable(function(err) {
        if (err) throw err;
        migrator.up(options, function(err) {
          migrator.driver.close();
          callback(err);
        });
      });
    });
  },
  down: function(options, callback) {
    if (arguments.length == 1) {
      callback = options;
      options = {};
    }
    options.config = options.config || exports.getDatabaseConfig();
    if (!options.destination && !options.count)
      options.count = 1;
    migrate.connect(options.config, function(err, migrator) {
      if (err) throw err;
      migrator.migrationsDir = exports.migrations.dir;
      migrator.driver.createMigrationsTable(function(err) {
        if (err) throw err;
        migrator.down(options, function(err) {
          migrator.driver.close();
          callback(err);
        });
      });
    });
  }
};

exports.getDatabaseConfig = function() {
  var config = JSON.parse(JSON.stringify(conf));
  if (usingTestDb) config.database = testDb.slice(1, -1);
  return config;
};

exports.createTables = function (callback) {
  callback = callback || function(){};
  exports.migrations.up(callback);
};

exports.createTestDatabase = function (callback) {
  var query = "CREATE DATABASE IF NOT EXISTS " + testDb + " CHARACTER SET '" + dbEncoding + "'";
  client.query(query, callback);
};

exports.useTestDatabase = function (callback) {
  usingTestDb = true;
  client.query("USE " + testDb, callback);
};

exports.dropTestDatabase = function (callback) {
  client.query("DROP DATABASE IF EXISTS " + testDb, callback);
};

exports.client = client;

client._insert = function (table, fields, callback) {
  var keys = Object.keys(fields);
  var values = keys.map(function (k) { return fields[k] });
  var placeholders = keys.map(function () { return '?' });
  var querystring
    = 'INSERT INTO `' + table + '` '
    + '(' + keys.join(', ') + ') '
    + 'VALUES '
    + '(' + placeholders.join(', ') + ')';

  client.query(querystring, values, callback);
};

client._upsert = function (table, fields, callback) {
  if (!fields['id']) return client._insert(table, fields, callback);
  var keys = Object.keys(fields);
  var values = keys.map(function (k) { return fields[k] });
  var querystring
    = 'UPDATE `' + table + '` SET '
    + keys.map(function (k) { return k + ' = ?'}).join(', ')
    + ' WHERE id = ?';

  values.push(fields['id']);
  client.query(querystring, values, callback);
};

exports.createTables();
