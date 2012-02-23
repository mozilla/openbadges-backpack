var loginUtils = require('./login-utils'),
    assert = require('assert');

var app = loginUtils.startApp();
var suite = loginUtils.suite('issuer api');

suite
  .discuss('when not logged in')
    .path('/issuer/assertion')
      .get().expect(403)
      .postFormData().expect(403)
    .unpath()
    .undiscuss().next()
  .discuss('when logged in')
    .login()
    .path('/issuer/assertion')
      .discuss('and providing no "url" argument')
        .get().expect(400)
        .postFormData().expect(400)
        .undiscuss()
      .discuss('and providing a malformed url')
        .get({url: 'LOLOL'}).expect(400)
        .postFormData({url: 'LOLOL'}).expect(400)
        .undiscuss()
      .discuss('and providing an unreachable url')
        .get({url: suite.url('/does/not/exist')}).expect(404)
        .postFormData({url: suite.url('/does/not/exist')}).expect(400)
        .undiscuss();

suite.export(module);
