var should = require('should');
var sinon = require('sinon');

var testUtil = require('./lib/util');
var request = testUtil.request;

describe("app", function() {
  it('should report errors', function(done) {
    sinon.stub(process.stderr, 'write');

    request({
      defineExtraRoutes: function(app) {
        app.get('/forced-error', function(req, res, next) {
          next(new Error('omg kaboom'));
        });
      }
    })
      .get('/forced-error')
      .expect('Sorry, something exploded!')
      .expect(500, function(err) {
        process.stderr.write.calledWithMatch('omg kaboom').should.eql(true);
        process.stderr.write.restore();
        done(err);
      });
  });

  it('should protect endpoints with CSRF', function(done) {
    request()
      .post('/blargy')
      .expect('Content-Type', 'text/plain')
      .expect('Forbidden')
      .expect(403, done);
  });

  it('auto-escapes template variables', function(done) {
    request({
      defineExtraRoutes: function(app) {
        app.get('/escaping', function(req, res) {
          return res.render('escaping.html', {foo: '<script>'});
        });
      },
      extraTemplateLoaders: [testUtil.templateLoader({
        'escaping.html': 'hi {{foo}}'
      })]
    })
      .get('/escaping')
      .expect('hi &lt;script&gt;')
      .expect(200, done);
  });

  it('defines PERSONA_JS_URL in app.locals', function() {
    testUtil.app().locals.PERSONA_JS_URL
      .should.match(/persona\.org\/include\.js/);
  });

  it('defines POST /persona/verify', function() {
    testUtil.app()._router.matchRequest({
      method: 'POST',
      url: '/persona/verify'
    }).should.be.a('object');
  });

  it('defines POST /persona/logout', function() {
    testUtil.app()._router.matchRequest({
      method: 'POST',
      url: '/persona/logout'
    }).should.be.a('object');
  });
});
