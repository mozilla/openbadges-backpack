var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.runSql('ALTER TABLE `user` CHANGE `passwd` `password` TEXT', callback);
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE `user` CHANGE `password` `passwd` TEXT', callback);
};
