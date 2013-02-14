var dbm = require('db-migrate');
var async = require('async');
var type = dbm.dataType;

exports.up = function(db, callback) {
  async.series([
    db.runSql.bind(db, 'ALTER TABLE `badge` ' +
                       'ADD public_path varchar(255) DEFAULT NULL UNIQUE;'),
    db.runSql.bind(db, 'ALTER TABLE `badge` ' +
                       'ADD public BOOLEAN DEFAULT FALSE;')
  ], callback);
};

exports.down = function(db, callback) {
  async.series([
    db.runSql.bind(db, 'ALTER TABLE `badge` ' +
                       'DROP COLUMN public_path;'),
    db.runSql.bind(db, 'ALTER TABLE `badge` ' +
                       'DROP COLUMN public;')
  ], callback);
};
