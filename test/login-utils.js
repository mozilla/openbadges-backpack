var browserid = require('../lib/browserid'),
    middleware = require('../middleware'),
    APIeasy = require('api-easy'),
    assert = require('assert');

function fakeBrowseridVerify(uri, assertion, audience, cb) {
  return cb(null, {email: module.exports.FAKE_EMAIL});
};

function fakeUid() {
  return module.exports.FAKE_UID;
};

function maybeSwapInFakes() {
  if (browserid.verify !== fakeBrowseridVerify)
    browserid.verify = fakeBrowseridVerify;
  if (middleware.utils.uid !== fakeUid)
    middleware.utils.uid = fakeUid;
}

module.exports = {
  PORT: 8889,
  FAKE_EMAIL: 'example@example.com',
  FAKE_UID: '1234',
  startApp: function() {
    maybeSwapInFakes();
    var app = require('../app');
    app.listen(this.PORT);
    return app;
  },
  suite: function(description) {
    var suite = APIeasy.describe(description);
    var port = this.PORT;
    suite.expectRedirectTo = function(path) {
      var url = 'http://localhost:' + port + path;
      return this.expect(303)
        .expect('redirects to ' + path, function(err, res) {
          assert.equal(res.headers['location'], url);
        });
    };
    suite.postBackpackAuthentication = function() {
      this.path('/backpack/authenticate')
        .setHeader('Content-Type', 'application/x-www-form-urlencoded')
        .post({'_csrf': module.exports.FAKE_UID, 'assertion': 'lol'});
      return this;
    };
    suite.login = function() {
      return this.postBackpackAuthentication().next().unpath();
    };
    suite.use('localhost', port).followRedirect(false);
    return suite;
  }
};
