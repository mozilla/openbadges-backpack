var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  var query = "ALTER TABLE `badge` ADD public BOOLEAN DEFAULT false";
  db.all(query, function(err, results) {
    callback();
  });
};

exports.down = function(db, callback) {
  var query = "ALTER TABLE `badge` DROP public";
  db.all(query, function(err, results) {
    callback();
  });
};
