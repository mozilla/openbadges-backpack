var _ = require('underscore');
var request = require('supertest');

var backpack = require('../../');

exports.app = function(options) {
  options = _.defaults(options || {}, {
    origin: 'http://example.org',
    cookieSecret: 's3cret'
  });

  if (options.testRoutes) {
    var testRoutes = options.testRoutes;

    options.defineExtraRoutes = function(app) {
      Object.keys(testRoutes).forEach(function(route) {
        var parts = route.split(' ', 2);
        var method = parts[0].toLowerCase();
        var path = parts[1];

        return app[method](path, testRoutes[route]);
      });
    };
    delete options.testRoutes;
  }

  if (options.testTemplates) {
    options.extraTemplateLoaders = [FakeLoader(options.testTemplates)];
    delete options.testTemplates;
  }

  return backpack.app.build(options);
};

exports.request = function(options) {
  var app = exports.app(options);

  return request(app);
};

var FakeLoader = exports.templateLoader = function FakeLoader(map) {
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
