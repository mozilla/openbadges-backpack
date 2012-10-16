var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  var query = "ALTER TABLE group ADD public_id VARCHAR(255) DEFAULT NULL UNIQUE";
  db.all(query, function(err, results) {
    callback();
  });
};

exports.down = function(db, callback) {
  var query = "ALTER TABLE group DROP public_id";
  db.all(query, function(err, results) {
    callback();
  });
};
