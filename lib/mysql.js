var mysql = require('mysql')
  , conf = require('../lib/configuration').get('database').relational

var client = mysql.createClient(conf)

var schemas = [
  "CREATE TABLE IF NOT EXISTS `user` ("+
    "id BIGINT AUTO_INCREMENT PRIMARY KEY,"+
    "email VARCHAR(255) UNIQUE NOT NULL,"+ 
    "passwd VARCHAR(255),"+
    "last_login TIMESTAMP NULL,"+
    "active BOOLEAN DEFAULT 1"+
  ") ENGINE=InnoDB;",

  "CREATE TABLE IF NOT EXISTS `collection` (" +
    "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
    "user_id BIGINT NOT NULL," +
    "name VARCHAR(255)," +
    "obfurl VARCHAR(255)," +
    "discoverable BOOLEAN DEFAULT 0," +
    "FOREIGN KEY user_fkey (user_id) REFERENCES `user`(id)" +
  ") ENGINE=InnoDB;",

  "CREATE TABLE IF NOT EXISTS `collection_badge` (" +
    "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
    "collection_id BIGINT NOT NULL," +
    "badge_ref VARCHAR(255) NOT NULL," +
    "FOREIGN KEY collection_fkey (collection_id) REFERENCES `collection`(id)" +
  ") ENGINE=InnoDB;"
];

exports.createTables = function () {
  schemas.forEach(function(schema){
    client.query(schema);
  })
}
exports.useTestDatabase = function () {
  var testDb = "`"+ conf.database+"_test`";
  client.query("CREATE DATABASE IF NOT EXISTS " + testDb);
  client.query("USE "+ testDb);
  exports.createTables();
}
exports.dropTestDatabase = function () {
  var testDb = "`"+ conf.database+"_test`";
  client.query("DROP DATABASE IF EXISTS " + testDb);
}
exports.prepareTesting = function () {
  exports.dropTestDatabase();
  exports.useTestDatabase();
}

exports.client = client

exports.createTables()

