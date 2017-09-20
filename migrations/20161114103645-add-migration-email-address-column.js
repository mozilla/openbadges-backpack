var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.runSql('ALTER TABLE `user` ADD  `migration_email` VARCHAR( 255 ) NULL DEFAULT NULL AFTER `email`', callback);
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE `user`  DROP `migration_email`', callback);
};
