var mysql = require('../lib/mysql'),
    Badge = require('./badge'),
    Base = require('./mysql-base.js');

var Collection = function (data) {
  this.data = data;
};
Base.apply(Collection, 'collection');
Collection.prototype.getBadgeObjects = function (callback) {
  var badgeIds = this.data.badges.slice(0),
      values = badgeIds,
      query = 'SELECT * FROM `badge` WHERE `id` IN ('
    + badgeIds.map(function(){return '?';}).join(',')
    + ') AND `user_id` = ?';
  values.push(this.data.user_id);
  return this.client.query(query, values, function (err, results) {
    if (err) { return callback(err); }
    callback(null, results.map(Badge.fromDbResult));
  });
}

module.exports = Collection;