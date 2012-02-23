const PORT = 8889;

var APIeasy = require('api-easy'),
    assert = require('assert');

var suite = APIeasy.describe('issuer/api');

suite.expectRedirectTo = function(path) {
  var url = 'http://localhost:' + PORT + path;
  return this.expect(303)
    .expect('redirects to ' + path, function(err, res) {
      assert.equal(res.headers['location'], url);
    });
};

var app = require('../app');
require('../lib/browserid').verify = function(uri, assertion, audience, cb) {
  return cb(null, {email: 'example@example.com'});
};
require('../middleware').utils.uid = function() {
  return '1234';
};
app.listen(PORT);

suite.use('localhost', PORT).followRedirect(false);

suite
  .discuss('when not logged in')
    .path('/')
      .get().expectRedirectTo('/backpack/login')
    .unpath()
    .path('/backpack/login')
      .get().expect(200).expect('has csrf token', function(err, res, body) {
        var re = /name="_csrf" type="hidden" value="(.*)"/;
        var match = body.match(re);
        assert.equal(match[1], '1234', "csrf exists in HTML");
      })
    .next().unpath()
    .path('/backpack/authenticate')
      .setHeader('Content-Type', 'application/x-www-form-urlencoded')
      .post({'_csrf': '1234', 'assertion': 'lol'})
      .expectRedirectTo('/')
      .expect('sets a session cookie', function(err, res, body) {
        assert.ok('set-cookie' in res.headers);
        var cookie = res.headers['set-cookie'][0];
        assert.equal(cookie.indexOf('openbadges_state'), 0);
      })
    .next().unpath().undiscuss()
  .discuss('when logged in')
    .path('/')
      .get().expect(200)
    .next().unpath()
    .path('/nonexistent')
      .get().expect(404)
    .next().unpath()
    .path('/backpack/signout')
      .get()
      .expectRedirectTo('/backpack/login')
    .next().undiscuss().unpath()
  .discuss('after logging out')
    .path('/')
      .get().expectRedirectTo('/backpack/login');
  
suite.export(module);
