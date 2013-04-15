const url = require('url');
const test = require('tap').test;
const testUtils = require('./');
const app = require('../app');
const request = require('request');
const async = require('async');

const FAKE_UID = '1234';
const FAKE_EMAIL = 'example@example.com';
const FAKE_ASSERTION = 'yup, it is example@example.com.';

function AppTestHarness(t, port) {
  this.t = t;
  this.undoModuleFunctionChanges = replaceModuleFunctionsForTesting(port);
  this.request = request.defaults({jar: request.jar()});
  this.port = port;
}

AppTestHarness.prototype = {
  end: function() {
    this.t.test('shutting down server', (function(t) {
      app.close();
      this.undoModuleFunctionChanges();
      t.end();
    }).bind(this));

    testUtils.finish(this.t.test.bind(this.t));

    this.t.end();
  },
  resolve: function(path) {
    return url.resolve("http://localhost:" + this.port, path);
  },
  email: FAKE_EMAIL,
  assertion: FAKE_ASSERTION,
  csrf: FAKE_UID,
  login: function() {
    var url = this.resolve('/backpack/authenticate');
    this.t.test(
      "login",
      ensureRequest(this.request, 'POST', url, {
        form: {
          '_csrf': FAKE_UID,
          'assertion': FAKE_ASSERTION
        }
      }, {
        statusCode: 303,
        responseHeaders: {
          'set-cookie': /openbadges_state=.*HttpOnly/,
          'location': '/'
        }
      })
    );
  },
  verifyRequest: function(method, url, options, assertions) {
    if (typeof(assertions) == 'undefined') {
      assertions = options;
      options = {};
    }

    this.t.test(
      method + ' ' + url,
      ensureRequest(this.request, method, this.resolve(url), options,
                    assertions)
    );
  }
};

exports.prepareApp = function prepareApp(cb) {
  test("preparing database and app", function(t) {
    testUtils.prepareDatabase(function () {
      app.listen(0, function() {
        var a = new AppTestHarness(t, app.address().port);
        cb(a);
      });
    });
  });
};

function ensureRequest(request, method, url, options, assertions) {
  var name = method + ' ' + url;

  options.method = method;
  return function(t) {
    request(url, options, function(err, res, body) {
      if (err) throw err;
      if (assertions.statusCode)
        t.same(res.statusCode, assertions.statusCode,
               name + ' returns status code ' + assertions.statusCode);
      if (assertions.body) {
        if (typeof(assertions.body) == "function")
          assertions.body(t, body);
        else if (assertions.body instanceof RegExp) {
          t.ok(body.match(assertions.body),
               name + ' body matches ' + assertions.body);
        } else {
          if (typeof(assertions.body) == "object")
            body = JSON.parse(body);
          t.same(body, assertions.body, name + ' body is valid');
        }
      }
      if (assertions.responseHeaders)
        Object.keys(assertions.responseHeaders).forEach(function(header) {
          var expected = assertions.responseHeaders[header];

          if (expected instanceof RegExp) {
            if (typeof(res.headers[header]) != 'undefined')
              t.ok(res.headers[header].toString().match(expected),
                   name + ' header "' + header + '" matches ' + expected);
            else
              t.ok(false, name + ' header "' + header + '" exists');
          } else
            t.same(res.headers[header], expected,
                   name + ' header "' + header + '" is ' + expected);
        });
      t.end();
    });
  };
}

function replaceModuleFunctionsForTesting(port) {
  var browserid = require('../lib/browserid');
  var middleware = require('../middleware');
  var conf = require('../lib/configuration');
  var testConf = {
    protocol: 'http:',
    hostname: 'localhost',
    port: port
  };
  var originalVerify = browserid.verify;
  var originalUid = middleware.utils.uid;
  var originalCreateSecureToken = middleware.utils.createSecureToken;
  var originalConfGet = conf.get;

  conf.get = function fakeGet(val, env) {
    if (val in testConf)
      return testConf[val];
    return originalConfGet.apply(conf, arguments);
  };
  middleware.utils.createSecureToken = function fakeCreateSecureToken() {
    return FAKE_UID;
  };
  middleware.utils.uid = function fakeUid() { return FAKE_UID; };
  browserid.verify = function fakeVerify(opts, cb) {
    var expected = FAKE_ASSERTION;
    if (opts.assertion == expected)
      return cb(null, FAKE_EMAIL);
    else
      return cb({code: 'invalid-assertion',
                 message: 'expected ' + JSON.stringify(expected) +
                       ' but got ' + JSON.stringify(opts.assertion)}, null);
  };

  return function undo() {
    conf.get = originalConfGet;
    browserid.verify = originalVerify;
    middleware.utils.uid = originalUid;
    middleware.utils.createSecureToken = originalCreateSecureToken;
  };
}
