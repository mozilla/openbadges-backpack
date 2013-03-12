var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.runSql('ALTER TABLE `badge` CHANGE `jwt` `signature` TEXT', callback);
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE `badge` CHANGE `signature` `jwt` TEXT', callback);
};