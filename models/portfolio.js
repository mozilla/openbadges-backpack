var mysql = require('../lib/mysql')
  , crypto = require('crypto')
  , Base = require('./mysql-base')
  , compose = require('functools').compose

var salt   = function (s) { return function (v) { return ''+v+s } };
var md5    = function (v) { return crypto.createHash('md5').update(v).digest('hex') };
var rnd    = function () { return (Math.random()*1000000000000000000); }
var urlgen = function (salter) { return compose(rnd, salter, md5)() }

var Portfolio = function (attributes) {
  if (!attributes.url) attributes.url = urlgen(salt(attributes.group_id))
  this.attributes = attributes;
};
Base.apply(Portfolio, 'portfolio');
Portfolio.prepare = {
  in: { stories: function (value) { return JSON.stringify(value); } },
  out: { stories: function (value) { return JSON.parse(value); } }
};
module.exports = Portfolio;
                           
