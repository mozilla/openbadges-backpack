var browserid = require('../lib/browserid'),
    middleware = require('../middleware'),
    APIeasy = require('api-easy'),
    assert = require('assert');

function fakeBrowseridVerify(uri, assertion, audience, cb) {
  var expected = module.exports.FAKE_ASSERTION;
  if (assertion == expected)
    return cb(null, {email: module.exports.FAKE_EMAIL});
  else
    return cb({type: 'invalid assertion',
               body: 'expected ' + JSON.stringify(expected) +
                     ' but got ' + JSON.stringify(assertion)}, null);
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
  FAKE_ASSERTION: 'yup, it is example@example.com.',
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
   
    suite.url = function(path) {
      return 'http://localhost:' + port + path;
    };
    suite.expectRedirectTo = function(path) {
      var url = this.url(path);
      return this.expect(303)
        .expect('redirects to ' + path, function(err, res) {
          assert.equal(res.headers['location'], url);
        });
    };
    suite._requestFormData = function(method, data) {
      data = data || {};
      if (!('_csrf' in data))
        data._csrf = module.exports.FAKE_UID;
      this.setHeader('Content-Type', 'application/x-www-form-urlencoded')
        [method](data);
      return this;
    };
    suite.delFormData = function(data) {
      return this._requestFormData('del', data);
    };
    suite.postFormData = function(data) {
      return this._requestFormData('post', data);
    };
    suite.postBackpackAuthentication = function(options) {
      options = options || {};
      var csrf = options.csrf || module.exports.FAKE_UID;
      var assertion = options.assertion || module.exports.FAKE_ASSERTION;
      return this.path('/backpack/authenticate')
                 .postFormData({'_csrf': csrf, 'assertion': assertion});
    };
    suite.login = function() {
      return this.postBackpackAuthentication()
        .expect('sets a session cookie', function(err, res, body) {
          assert.ok('set-cookie' in res.headers);
        }).next().unpath();
    };
    suite.use('localhost', port).followRedirect(false);
    return suite;
  }
};
