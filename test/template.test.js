var _ = require('underscore');
var should = require('should');

var request = require('./lib/util').request;

describe("layout.html", function() {
  function layoutRequest(options) {
    return request({
      testRoutes: {
        'GET /layout': function(req, res) {
          return res.render('layout.html');
        }
      },
      defineExtraMiddleware: function(app) {
        app.use(function(req, res, next) {
          _.extend(res.locals, options.resLocals);
          next();
        });
      }
    }).get('/layout');
  }

  it('defines csrf meta tag', function(done) {
    layoutRequest({resLocals: {csrfToken: "CSRFTOKEN IS HERE"}})
      .expect(/<meta name="csrf" content="CSRFTOKEN IS HERE">/)
      .end(done);
  });

  it('defines email meta tag', function(done) {
    layoutRequest({resLocals: {email: "foo@bar.org"}})
      .expect(/<meta name="email" content="foo@bar.org">/)
      .end(done);
  });
});
