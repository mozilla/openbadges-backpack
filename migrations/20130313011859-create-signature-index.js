var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.runSql('CREATE INDEX `signatureprefix` ON `badge`(`signature`(60))', callback);
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE `badge` DROP INDEX `signatureprefix`', callback);
};
