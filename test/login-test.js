var loginUtils = require('./login-utils'),
    assert = require('assert');

var app = loginUtils.startApp();
var suite = loginUtils.suite('login');

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
    .postBackpackAuthentication()
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
