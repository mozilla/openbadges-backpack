var dbm = require('db-migrate');
var async = require('async');
var type = dbm.dataType;

exports.up = function(db, callback) {
  async.series([
    db.runSql.bind(db, 'ALTER TABLE `user` ADD  `email_is_verified` BOOLEAN DEFAULT 0 AFTER `email`'),
    db.runSql.bind(db, 'ALTER TABLE `user` ADD  `email_verification_code` VARCHAR( 255 ) NULL DEFAULT NULL AFTER `email_is_verified`'),
  ], callback);
};

exports.down = function(db, callback) {
  async.series([
  	db.runSql.bind(db, 'ALTER TABLE `user`  DROP `email_is_verified`'),
  	db.runSql.bind(db, 'ALTER TABLE `user`  DROP `email_verification_code`'),
  ], callback);
};
