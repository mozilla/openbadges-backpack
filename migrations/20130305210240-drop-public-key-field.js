var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.runSql('ALTER TABLE `badge` DROP public_key;', callback);
};

exports.down = function(db, callback) {
  // no down since there's no way to recover dropped data.
  throw new Error('Cannot rewind migration: dropped column `badge`.`public_key`.')
};
