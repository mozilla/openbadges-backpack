var mysql = require('mysql')
  , url = require('url')
  , Base = require('./mysql-base');

var Badge = function (data) {
  this.data = data;
  this.prepare = {
    body: function (v) { return JSON.stringify(v); }
  }
}
Base.apply(Badge, 'badge');
module.exports = Badge;