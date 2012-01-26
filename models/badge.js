var mysql = require('mysql')
  , url = require('url')
  , Base = require('./mysql-base')
  , regex = require('../lib/regex')

var Badge = function (data) {
  this.data = data;
  this.prepare = {
    body: function (v) { return JSON.stringify(v); }
  }
  this.validators = {
    'type': function (v, data) {
      if (v === 'hosted' && !data.endpoint) {
        return "If type is hosted, endpoint must be set";
      }
      if (v === 'signed' && !data.jwt) {
        return "If type is signed, jwt must be set";
      }
    },
    'endpoint': function (v, data) {
      if (!v && data.type === 'hosted') {
        return "If type is hosted, endpoint must be set";
      }
    },
    'jwt': function (v, data) {
      if (!v && data.type === 'signed') {
        return "If type is signed, jwt must be set";
      }
    },
    'image_path': function (v) {
      if (!v) { return "Must have an image path."; }
    },
    'body': function (v) {
      if (!v) { return "Must have a body."; }
      if (String(v) !== '[object Object]') { return "body must be an object"; }
    }
  }
}
Base.apply(Badge, 'badge');
module.exports = Badge;