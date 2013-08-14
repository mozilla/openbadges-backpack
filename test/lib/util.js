var _ = require('underscore');
var request = require('supertest');

var backpack = require('../../');

exports.app = function(options) {
  options = _.defaults(options || {}, {
    origin: 'http://example.org'
  });

  return backpack.app.build(options);
};

exports.request = function(options) {
  var app = exports.app(options);

  return request(app);
};
