var should = require('should');
var sinon = require('sinon');

var request = require('./lib/util').request;

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
});
