var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.runSql('ALTER TABLE `badge_image` ADD `baked` BOOLEAN DEFAULT FALSE', callback)
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE `badge_image` DROP COLUMN `baked`', callback)
};
