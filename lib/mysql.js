var mysql = require('mysql');
var conf = require('../lib/configuration').get('database');
var client = mysql.createClient(conf);
var dbm = require('db-migrate');

var encoding = "utf8";
var testdb = "test_" + conf.database;

function prepareTesting(cb) {
  client.query("DROP DATABASE IF EXISTS " + testdb, function(err, result) {
    client.query("CREATE DATABASE " + testdb + " CHARACTER SET '" + encoding + "'", function(err, result) {      
      client.query("USE " + testdb, function() {
        client.database = testdb;
        dbm.up({
          "driver": "mysql",
          "user": "badgemaker",
          "password": "secret",
          "database": testdb,
          "db": client
        }, __dirname + "/../migrations", undefined, undefined, cb);        
      });
    });
  });
}

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

exports.client = client;
exports.prepareTesting = prepareTesting;