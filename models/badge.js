var mysql = require('mysql')
  , url = require('url')
  , Base = require('./mysql-base');

var Badge = function (data) {
  this.data = data;
  this.prepare = {
    body: function (v) { return JSON.stringify(v); }
  }
  this.validate = function (data) {
    var err = new Error('Invalid data');
    err.fields = {}
    data = (data || this.data);
    if (data.type === 'hosted' && !data.endpoint) {
      err.fields.type = "If type is hosted, endpoint must be set";
      err.fields.endpoint = "If type is hosted, endpoint must be set";
    }
    if (Object.keys(err.fields).length > 0) { return err; }
  }
}
Base.apply(Badge, 'badge');
module.exports = Badge;