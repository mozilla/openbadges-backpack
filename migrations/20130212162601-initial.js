var dbm = require('db-migrate');
var type = dbm.dataType;
var async = require('async');

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

exports.up = function(db, callback) {
  async.map(schemas, function(schema, callback) {
    db.runSql(schema, callback);
  }, callback);
};

exports.down = function(db, callback) {
  async.series([
    db.runSql.bind(db, 'DROP TABLE IF EXISTS `portfolio`;'),
    db.runSql.bind(db, 'DROP TABLE IF EXISTS `group`;'),
    db.runSql.bind(db, 'DROP TABLE IF EXISTS `badge`;'),
    db.runSql.bind(db, 'DROP TABLE IF EXISTS `user`;')
  ], callback);
};
