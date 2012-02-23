var loginUtils = require('./login-utils'),
    assert = require('assert');

var app = loginUtils.startApp();
var suite = loginUtils.suite('issuer api');

suite
  .discuss('when not logged in')
    .path('/issuer/assertion')
      .get({url: 'http://blah/'}).expect(403)
    .unpath()
    .undiscuss().next()
  .discuss('when logged in')
    .login()
    .discuss('and passing no url querystring arg')
    .path('/issuer/assertion')
      .get().expect(400);

suite.export(module);
