var dbm = require('db-migrate');
var type = dbm.dataType;
var async = require('async');

exports.up = function(db, callback) {
  async.series([
    db.runSql.bind(db, ''
      + 'CREATE TABLE `badge_image` ('
      + '  `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,'
      + '  `badge_hash`  VARCHAR(255),'
      + '  `image_data`  LONGBLOB,'
      + '  FOREIGN KEY `badge_fkey` (`badge_hash`) REFERENCES `badge`(`body_hash`)'
      + ') ENGINE=InnoDB;'
    ),
    db.runSql.bind(db, ''
      + 'INSERT INTO `badge_image` (`badge_hash`, `image_data`)'
      + 'SELECT `body_hash`, `image_data`'
      + 'FROM `badge`'
    ),
    db.runSql.bind(db, 'ALTER TABLE `badge` DROP image_data'),
  ], callback);
};

exports.down = function(db, callback) {
  async.series([
    db.runSql.bind(db, 'ALTER TABLE `badge` ADD `image_data` LONGBLOB DEFAULT NULL'),
    db.runSql.bind(db, 'UPDATE `badge` INNER JOIN `badge_image` ON `badge_image`.`badge_hash` = `badge`.`body_hash` SET `badge`.`image_data` = `badge_image`.`image_data`'),
  ], callback);
};
