var mysql = require('mysql')
  , conf = require('../lib/configuration').get('database')
  , client = mysql.createClient(conf)
  , testDb = "`test_" + conf.database + "`";

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
  + ") ENGINE=InnoDB;"
];

exports.schemas = schemas;

exports.createTables = function () {
  schemas.forEach(function(schema){
    client.query(schema);
  })
}
exports.useTestDatabase = function () {
  client.query("CREATE DATABASE IF NOT EXISTS " + testDb);
  client.query("USE "+ testDb);
}
exports.dropTestDatabase = function () {
  client.query("DROP DATABASE IF EXISTS " + testDb);
}
exports.prepareTesting = function () {
  exports.dropTestDatabase();
  exports.useTestDatabase();
  exports.createTables();
}

exports.client = client
client._insert = function (table, fields, callback) {
  var keys = Object.keys(fields)
    , values = keys.map(function (k) { return fields[k] })
    , placeholders = keys.map(function () { return '?' });
  var querystring
    = 'INSERT INTO `'+table+'` '
    + '('+keys.join(', ')+') '
    + 'VALUES '
    + '('+placeholders.join(', ')+')';

  client.query(querystring, values, callback);
}

client._upsert = function (table, fields, callback) {
  if (!fields['id']) return client._insert(table, fields, callback);
  var keys = Object.keys(fields)
    , values = keys.map(function (k) { return fields[k] })
  var querystring
    = 'UPDATE `'+table+'` SET '
    + keys.map(function (k) { return k + ' = ?'}).join(', ')
    + ' WHERE id = ?'

  values.push(fields['id']);
  client.query(querystring, values, callback)
}
exports.createTables()
