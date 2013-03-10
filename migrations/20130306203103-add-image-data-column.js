var fs = require('fs');
var dbm = require('db-migrate');
var pathutil = require('path');
var async = require('async');
var conf = require('../lib/configuration');
var type = dbm.dataType;

exports.up = function(db, callback) {
  const path = conf.get('badge_path').replace(/static.*/, 'static');
  function storeImageData(entry, callback) {
    if (!entry.image_path) return callback();
    try {
      const data = fs.readFileSync(pathutil.join(path, entry.image_path));
    } catch (e) {
      console.log('skipping ', pathutil.join(path, entry.image_path));
      return callback();
    }
    const sql = 'UPDATE `badge` SET `image_data` = ? WHERE `id` = ? LIMIT 1';
    db.runSql(sql, [data.toString('base64'), entry.id], function () {
      delete data;
      return callback();
    });
  }

  function wrap(callback) {
    return function (err, data) { return callback(err, data) }
  }

  async.waterfall([
    function addColumn(callback) {
      const sql = 'ALTER TABLE `badge` ADD image_data LONGBLOB DEFAULT NULL;';
      return db.runSql(sql, wrap(callback))
    },
    function getImagePaths(data, callback) {
      const sql = 'SELECT id, image_path FROM `badge`';
      return db.runSql(sql, wrap(callback));
    },
    function storeImages(data, callback) {
      async.eachSeries(data, storeImageData, callback)
    }
  ], callback);
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE `badge` DROP image_data;', callback);
};
