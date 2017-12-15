var dbm = require('db-migrate');
var async = require('async');
var type = dbm.dataType;

exports.up = function(db, callback) {
  async.series([
    db.runSql.bind(db, 'ALTER TABLE `user` ADD  `first_name` VARCHAR( 255 ) NULL DEFAULT NULL AFTER `id`'),
    db.runSql.bind(db, 'ALTER TABLE `user` ADD  `last_name` VARCHAR( 255 ) NULL DEFAULT NULL AFTER `first_name`'),
  ], callback);
};

exports.down = function(db, callback) {
  async.series([
  	db.runSql.bind(db, 'ALTER TABLE `user`  DROP `first_name`'),
  	db.runSql.bind(db, 'ALTER TABLE `user`  DROP `last_name`'),
  ], callback);
};
