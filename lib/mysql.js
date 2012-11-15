var mysql = require('mysql');
var async = require('async');
var conf = require('../lib/configuration').get('database');
var client = mysql.createClient(conf);
var testDb = "`test_" + conf.database + "`";

var dbEncoding = 'utf8';

var schemas = [
  "CREATE TABLE IF NOT EXISTS `user` ("
    + "id               BIGINT AUTO_INCREMENT PRIMARY KEY,"
    + "email            VARCHAR(255) UNIQUE NOT NULL,"
    + "last_login       INT(13) NULL,"
    + "active           BOOLEAN DEFAULT 1,"
    + "passwd           VARCHAR(255),"
    + "salt             TINYBLOB"
  + ") ENGINE=InnoDB;",

  "CREATE TABLE IF NOT EXISTS `badge` ("
    + "id            BIGINT AUTO_INCREMENT PRIMARY KEY,"
    + "user_id       BIGINT,"
    + "type          ENUM('hosted', 'signed') NOT NULL,"
    + "endpoint      TINYTEXT,"
    + "public_key    TEXT,"
    + "jwt           TEXT,"
    + "image_path    VARCHAR(255) NOT NULL,"
    + "rejected      BOOLEAN DEFAULT 0,"
    + "body          MEDIUMBLOB NOT NULL,"
    + "body_hash     VARCHAR(255) UNIQUE NOT NULL,"
    + "validated_on  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
    + "FOREIGN KEY user_fkey (user_id) REFERENCES `user`(id)"
  + ") ENGINE=InnoDB;",

  "CREATE TABLE IF NOT EXISTS `group` ("
    + "id               BIGINT AUTO_INCREMENT PRIMARY KEY,"
    + "user_id          BIGINT NOT NULL,"
    + "name             VARCHAR(255),"
    + "url              VARCHAR(255) UNIQUE,"
    + "public           BOOLEAN DEFAULT 0,"
    + "badges           MEDIUMBLOB NOT NULL,"
    + "FOREIGN KEY user_fkey (user_id) REFERENCES `user`(id)"
  + ") ENGINE=InnoDB;",

  "CREATE TABLE IF NOT EXISTS `portfolio` ("
    + "`id`               bigint AUTO_INCREMENT PRIMARY KEY,"
    + "`group_id`         bigint NOT NULL,"
    + "`url`              varchar(255) UNIQUE,"
    + "`title`            varchar(128),"
    + "`subtitle`         varchar(128),"
    + "`preamble`         text,"
    + "`stories`          mediumblob,"
    + "FOREIGN KEY `group_fkey` (`group_id`) REFERENCES `group`(`id`)"
  + ") ENGINE=InnoDB;"
];

exports.schemas = schemas;

function createSchema(schema, callback) { client.query(schema, callback) }
exports.createTables = function (callback) {
  callback = callback || function(){};
  async.map(schemas, createSchema, callback);
};

exports.createTestDatabase = function (callback) {
  callback = callback || function(){};
  var query = "CREATE DATABASE IF NOT EXISTS " + testDb + " CHARACTER SET '" + dbEncoding + "'";
  console.dir(query);
  client.query(query, callback);
};

exports.useTestDatabase = function (callback) {
  callback = callback || function(){};
  client.query("USE " + testDb, callback);
};

exports.dropTestDatabase = function (callback) {
  callback = callback || function(){};
  client.query("DROP DATABASE IF EXISTS " + testDb, callback);
};

exports.prepareTesting = function (callback) {
  callback = callback || function(){}
  function done() { client.destroy() }
  async.series([
    exports.dropTestDatabase,
    exports.createTestDatabase,
    exports.useTestDatabase,
    exports.createTables
  ], function (err, results) {
    if (err) throw err;
    callback(done);
  });
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
