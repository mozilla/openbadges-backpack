var async = require('async');
var dbm = require('db-migrate');
var type = dbm.dataType;
    
function wrap(callback) {
  return function (err, data) { return callback(err, data) }
}

function getConstraintName(db) {
  return function(callback) {
    const sql = ''
      + 'SELECT constraint_name'
      + ' FROM information_schema.REFERENTIAL_CONSTRAINTS'
      + ' WHERE constraint_schema = (select database())'
      + ' AND table_name = \'badge_image\'';
    return db.runSql(sql, wrap(callback));
  };
}

function removeConstraint(db) {
  return function(data, callback) {
    const fkeyName = data[0].constraint_name;
    const sql = 'ALTER TABLE `badge_image` DROP FOREIGN KEY ' + fkeyName;
    return db.runSql(sql, wrap(callback));
  };
}

function addNewConstraint(db, params) {
  var sql = ''
    + 'ALTER TABLE `badge_image`'
    + ' ADD FOREIGN KEY `badge_fkey` (`badge_hash`) REFERENCES `badge`(`body_hash`)';
  if (params.cascade) 
    sql += ' ON DELETE CASCADE';
  return function (data, callback) {
    return db.runSql(sql, wrap(callback));
  };
}

exports.up = function(db, callback) {

  async.waterfall([
    getConstraintName(db),
    removeConstraint(db),
    addNewConstraint(db, { cascade: true })
  ], callback);
};

exports.down = function(db, callback) {
  async.waterfall([
    getConstraintName(db),
    removeConstraint(db),
    addNewConstraint(db, { cascade: false })
  ], callback);
};
