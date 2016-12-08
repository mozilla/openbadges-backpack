var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.runSql('ALTER TABLE `user` ADD `reset_password_token` VARCHAR(64) NULL DEFAULT NULL, ADD `reset_password_expires` BIGINT(13) NULL DEFAULT NULL', callback);
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE `user` DROP `reset_password_token`, DROP `reset_password_expires`', callback);
};
