var dbm = require('db-migrate');
var async = require('async');
var type = dbm.dataType;

exports.up = function(db, callback) {
  async.series([
    db.runSql.bind(db, 'ALTER TABLE `user` ADD  `additional_email_1` VARCHAR( 255 ) NULL DEFAULT NULL AFTER `email`'),
    db.runSql.bind(db, 'ALTER TABLE `user` ADD  `additional_email_1_is_verified` BOOLEAN DEFAULT 0 AFTER `additional_email_1`'),
    db.runSql.bind(db, 'ALTER TABLE `user` ADD  `additional_email_1_verification_code` VARCHAR( 255 ) NULL DEFAULT NULL AFTER `additional_email_1_is_verified`'),
    db.runSql.bind(db, 'ALTER TABLE `user` ADD  `additional_email_2` VARCHAR( 255 ) NULL DEFAULT NULL AFTER `additional_email_1_verification_code`'),
    db.runSql.bind(db, 'ALTER TABLE `user` ADD  `additional_email_2_is_verified` BOOLEAN DEFAULT 0 AFTER `additional_email_2`'),
    db.runSql.bind(db, 'ALTER TABLE `user` ADD  `additional_email_2_verification_code` VARCHAR( 255 ) NULL DEFAULT NULL AFTER `additional_email_2_is_verified`')
  ], callback);
};

exports.down = function(db, callback) {
  async.series([
  	db.runSql.bind(db, 'ALTER TABLE `user`  DROP `additional_email_1`'),
  	db.runSql.bind(db, 'ALTER TABLE `user`  DROP `additional_email_1_is_verified`'),
  	db.runSql.bind(db, 'ALTER TABLE `user`  DROP `additional_email_1_verification_code`'),
  	db.runSql.bind(db, 'ALTER TABLE `user`  DROP `additional_email_2`'),
  	db.runSql.bind(db, 'ALTER TABLE `user`  DROP `additional_email_2_is_verified`'),
  	db.runSql.bind(db, 'ALTER TABLE `user`  DROP `additional_email_2_verification_code`')
  ], callback);
};
