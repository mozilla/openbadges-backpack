var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.runSql('ALTER TABLE  `user` ADD  `created_at` BIGINT( 13 ) NULL DEFAULT NULL, ADD  `updated_at` BIGINT( 13 ) NULL DEFAULT NULL', callback);
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE `user`  DROP `created_at`,  DROP `updated_at`', callback);
};
