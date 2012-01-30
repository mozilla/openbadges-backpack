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
      placeholders = badgeIds.map(function(){return '?';}).join(','),
      query = 'SELECT * FROM `badge` WHERE `id` IN (' + placeholders + ') AND `user_id` = ?';
  values.push(this.data.user_id);
  return this.client.query(query, values, function (err, results) {
    if (err) { return callback(err); }
    callback(null, results.map(Badge.fromDbResult));
  });
}
Collection.prepare = {
  in: {
    badges: function (value) {
      // Assume this is an array of badge items if it's an array of objects.
      if (value.toString().match('[object Object]')) {
        return value.map(function (v) { return v.data.id });
      }
      return value;
    }
  }
};

module.exports = Collection;