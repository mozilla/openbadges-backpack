var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.runSql('CREATE INDEX `endpointindex` ON `badge`(`endpoint`(30))', callback);
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE `badge` DROP INDEX `endpointindex`', callback);
};
