var _ = require('underscore');
var request = require('supertest');

var backpack = require('../../');

exports.app = function(options) {
  options = _.defaults(options || {}, {
    origin: 'http://example.org',
    cookieSecret: 's3cret'
  });

  return backpack.app.build(options);
};

exports.request = function(options) {
  var app = exports.app(options);

  return request(app);
};

exports.templateLoader = function FakeLoader(map) {
  return {
    getSource: function(name) {
      if (name in map) {
        return {
          src: map[name],
          path: name,
          upToDate: function() { return true; }
        };
      }
    }
  };
};
