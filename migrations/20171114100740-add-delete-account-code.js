var dbm = require('db-migrate');
var async = require('async');
var type = dbm.dataType;

exports.up = function(db, callback) {
  async.series([
    db.runSql.bind(db, 'ALTER TABLE `user` ADD  `delete_account_code_requested` BOOLEAN DEFAULT 0'),
    db.runSql.bind(db, 'ALTER TABLE `user` ADD  `delete_account_code` VARCHAR( 255 ) NULL DEFAULT NULL'),
  ], callback);
};

exports.down = function(db, callback) {
  async.series([
  	db.runSql.bind(db, 'ALTER TABLE `user`  DROP `delete_account_code_requested`'),
  	db.runSql.bind(db, 'ALTER TABLE `user`  DROP `delete_account_code`'),
  ], callback);
};
