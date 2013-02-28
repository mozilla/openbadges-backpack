var dbm = require('db-migrate');
var async = require('async');
var type = dbm.dataType;

exports.up = function(db, callback) {
  async.series([
    db.runSql.bind(db, 'ALTER TABLE `user` ' +
                       'ADD fb_access_token VARCHAR(255) DEFAULT NULL')
  ], callback);
};

exports.down = function(db, callback) {
  async.series([
    db.runSql.bind(db, 'ALTER TABLE `user` ' +
                       'DROP COLUMN fb_access_token;')
  ], callback);
};