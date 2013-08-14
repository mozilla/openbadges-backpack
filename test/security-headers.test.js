var should = require('should');

var request = require('./lib/util').request;

describe("app security headers", function() {
  it('enable HSTS if protocol is HTTPS', function(done) {
    request({origin: 'https://foo.org'})
      .get('/')
      .expect('Strict-Transport-Security',
              'max-age=31536000; includeSubDomains', done);
  });

  it('do not enable HSTS if protocol is HTTP', function(done) {
    request({origin: 'http://foo.org'})
      .get('/').end(function(err, res) {
        if (err) return done(err);
        if ('strict-transport-security' in res.headers)
          throw new Error('HSTS header exists!');
        done();
      });
  });

  it('disallow embedding in iframes by default', function(done) {
    request()
      .get('/')
      .expect('X-Frame-Options', 'DENY', done)
  });

  it('prevent IE from performing content sniffing', function(done) {
    request()
      .get('/')
      .expect('X-Content-Type-Options', 'nosniff', done)
  });

  it('enable content security policy on self', function(done) {
    request()
      .get('/')
      .expect('Content-Security-Policy', /'self'/, done);
  });

  it('enable content security policy on persona.org', function(done) {
    request()
      .get('/')
      .expect('Content-Security-Policy', /persona\.org/, done);
  });

  it('do not allow eval() by default', function(done) {
    request()
      .get('/')
      .end(function(err, res) {
        if (err) return done(err);
        res.headers['content-security-policy']
          .should.not.match(/'unsafe-eval'/);
        done();
      });
  });

  it('allow eval() in content security policy at /test/', function(done) {
    request()
      .get('/test/')
      .expect('Content-Security-Policy', /'unsafe-eval'/, done);
  });
});
