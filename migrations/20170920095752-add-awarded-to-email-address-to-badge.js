var dbm = require('db-migrate');
var async = require('async');
var type = dbm.dataType;

exports.up = function(db, callback) {
  async.series([
    db.runSql.bind(db, 'ALTER TABLE `badge` ADD  `awarded_to_email_address` VARCHAR( 255 ) NULL DEFAULT NULL AFTER `user_id`'),
    db.runSql.bind(db, 'UPDATE `badge` SET `awarded_to_email_address` = (SELECT `email` FROM `user` WHERE `user`.`id` = `user_id`)'),
  ], callback);
};

exports.down = function(db, callback) {
  async.series([
  	db.runSql.bind(db, 'ALTER TABLE `badge`  DROP `awarded_to_email_address`'),
  ], callback);
};
