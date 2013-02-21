var mysql = require('../lib/mysql');
var crypto = require('crypto');
var Badge = require('./badge');
var Base = require('./mysql-base.js');
var _ = require('underscore');

function md5(v) {
  var sum = crypto.createHash('md5');
  sum.update(v);
  return sum.digest('hex');
}

var Group = function (attributes) {
  if (attributes.badges.toString().match('[object Object]'))
    // Assume this is an array of badge items if it's an array of objects.
    attributes.badges = attributes.badges.map(function (v) {
      return v.attributes.id;
    });
  this.attributes = attributes;
};

Base.apply(Group, 'group');

Group.prototype.updateUrl = function updateUrl() {
  this.set('url', md5('' + this.get('name') + this.get('user_id') + Date.now()));
};

Group.prototype.getBadgeObjects = function getBadgeObjects(callback) {
  var badges = this.get('badges');
  var badgeIds = (typeof badges === "string" ? JSON.parse(badges) : badges);
  var values = badgeIds;
  var placeholders = badgeIds.map(function () { return '?' }).join(',');
  var query = 'SELECT * FROM `badge` WHERE `id` IN (' + placeholders + ') AND `user_id` = ?';
  
  values.push(this.get('user_id'));
  return this.client.query(query, values, function (err, results) {
    if (err) { return callback(err); }
    callback(null, results.map(Badge.fromDbResult));
  });
};

Group.prototype.presave = function presave() {
  if (!this.attributes.id && !this.attributes.url) { this.updateUrl(); }
};

Group.prepare = {
  'in': {
    badges: function (value) {
      if (!value) { return; }
      return JSON.stringify(value);
    }
  },
  'out': {
    badges: function (value) {
      if (value) { return JSON.parse(value) }
    }
  }
};

module.exports = Group;