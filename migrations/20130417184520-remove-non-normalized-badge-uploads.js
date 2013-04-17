var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  var goodPattern = '"badge":{'; // body.badge is an object
  db.runSql("DELETE FROM `badge` WHERE `body` NOT RLIKE ?", [goodPattern], callback);
};

exports.down = function(db, callback) {
  // No way to recover broken badges (and don't want to), 
  // but rest of data should be fine, so noop.
  callback();
};
