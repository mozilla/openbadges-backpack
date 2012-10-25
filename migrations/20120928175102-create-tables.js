var dbm = require('db-migrate');
var type = dbm.dataType;
var _ = require("lodash");
var schemas = {
  "user": "CREATE TABLE IF NOT EXISTS `user` ("
    + "id               BIGINT AUTO_INCREMENT PRIMARY KEY,"
    + "email            VARCHAR(255) UNIQUE NOT NULL,"
    + "last_login       INT(13) NULL,"
    + "active           BOOLEAN DEFAULT 1,"
    + "passwd           VARCHAR(255),"
    + "salt             TINYBLOB"
  + ") ENGINE=InnoDB;",

  "badge": "CREATE TABLE IF NOT EXISTS `badge` ("
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

  "group": "CREATE TABLE IF NOT EXISTS `group` ("
    + "id               BIGINT AUTO_INCREMENT PRIMARY KEY,"
    + "user_id          BIGINT NOT NULL,"
    + "name             VARCHAR(255),"
    + "url              VARCHAR(255) UNIQUE,"
    + "public           BOOLEAN DEFAULT 0,"
    + "badges           MEDIUMBLOB NOT NULL,"
    + "FOREIGN KEY user_fkey (user_id) REFERENCES `user`(id)"
  + ") ENGINE=InnoDB;",

  "portfolio": "CREATE TABLE IF NOT EXISTS `portfolio` ("
    + "`id`               bigint AUTO_INCREMENT PRIMARY KEY,"
    + "`group_id`         bigint NOT NULL,"
    + "`url`              varchar(255) UNIQUE,"
    + "`title`            varchar(128),"
    + "`subtitle`         varchar(128),"
    + "`preamble`         text,"
    + "`stories`          mediumblob,"
    + "FOREIGN KEY `group_fkey` (`group_id`) REFERENCES `group`(`id`)"
  + ") ENGINE=InnoDB;"
};

exports.up = function(db, callback) {
  var pending = _.size(schemas);
  _.forEach(schemas, function(schema) {            
    db.all(schema, function(err, results) {
      -- pending;
      if(!pending) {
        callback();
      }
    });
  });
};

exports.down = function(db, callback) {
  var tables = Object.keys(schemas);
  tables.reverse();
  var pending = tables.length;

  _.forEach(tables, function(name) {
    db.all("DROP TABLE `" + name + "`", function(err, results) {
      -- pending;
      if(!pending) {
        callback();
      }
    });
  });
};
