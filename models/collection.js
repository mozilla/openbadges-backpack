var mysql = require('../lib/mysql')
  , crypto = require('crypto')
  , Badge = require('./badge')
  , Base = require('./mysql-base.js');

var md5 = function (v) {
  var sum = crypto.createHash('md5');
  sum.update(v);
  return sum.digest('hex');
};

var Collection = function (data) {
  this.data = data;
};

Base.apply(Collection, 'collection');

Collection.prototype.updateUrl = function () {
  var data = this.data;
  data.url = md5('' + data.name + data.user_id + Date.now());  
};

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
};

Collection.prototype.presave = function () {
  if (!this.data.id && !this.data.url) { this.updateUrl(); }
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