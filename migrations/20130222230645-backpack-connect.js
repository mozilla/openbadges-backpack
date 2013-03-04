var dbm = require('db-migrate');
var type = dbm.dataType;
var async = require('async');

var schemas = [
  "CREATE TABLE IF NOT EXISTS `bpc_session` ("
    + "id               BIGINT AUTO_INCREMENT PRIMARY KEY,"
    + "user_id          BIGINT NOT NULL,"
    + "access_time      INT(13) NOT NULL,"
    + "access_token     VARCHAR(255) UNIQUE NOT NULL,"
    + "refresh_token    VARCHAR(255) UNIQUE NOT NULL,"
    + "permissions      VARCHAR(255) NOT NULL,"
    + "origin           VARCHAR(255) NOT NULL,"
    + "FOREIGN KEY user_fkey (user_id) REFERENCES `user`(id)"
  + ") ENGINE=InnoDB;"
];

exports.up = function(db, callback) {
  async.map(schemas, function(schema, callback) {
    db.runSql(schema, callback);
  }, callback);
};

exports.down = function(db, callback) {
  async.series([
    db.runSql.bind(db, 'DROP TABLE IF EXISTS `bpc_session`;')
  ], callback);
};
