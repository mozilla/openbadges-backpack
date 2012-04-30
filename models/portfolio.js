var mysql = require('../lib/mysql');
var crypto = require('crypto');
var Base = require('./mysql-base');
var compose = require('functools').compose;

function salt(s) { return function (v) { return '' + v + s }; }
function md5(v) { return crypto.createHash('md5').update(v).digest('hex'); }
function rnd() { return (Math.random() * 1000000000000000000); }
function urlgen(salter) { return compose(rnd, salter, md5)(); }

var Portfolio = function (attributes) {
  if (!attributes.url) attributes.url = urlgen(salt(attributes.group_id));
  this.attributes = attributes;
};
Base.apply(Portfolio, 'portfolio');
Portfolio.prepare = {
  'in': { stories: function (value) { return JSON.stringify(value); } },
  'out': { stories: function (value) { return JSON.parse(value); } }
};
module.exports = Portfolio;
                           
