var mysql = require('../lib/mysql');
var crypto = require('crypto');
var Base = require('./mysql-base');

function md5(value) {
  return (
    crypto
      .createHash('md5')
      .update(value)
      .digest('hex')
  );
}
function urlgen(value) {
  const nonce = Math.random() * 0x10000000;
  return md5('' + value + Date.now() + nonce);
}

var Portfolio = function (attributes) {
  if (!attributes.url) attributes.url = urlgen(attributes.group_id);
  this.attributes = attributes;
};
Base.apply(Portfolio, 'portfolio');
Portfolio.prepare = {
  'in': { stories: function (value) { return JSON.stringify(value); } },
  'out': { stories: function (value) { return JSON.parse(value); } }
};
module.exports = Portfolio;

