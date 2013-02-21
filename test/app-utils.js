const url = require('url');
const test = require('tap').test;
const testUtils = require('./');
const app = require('../app');
const request = require('request');
const async = require('async');
const browserid = require('../lib/browserid');
const middleware = require('../middleware');

const PORT = 8889;
const BASE_URL = 'http://localhost:' + PORT;
const FAKE_UID = '1234';
const FAKE_EMAIL = 'example@example.com';
const FAKE_ASSERTION = 'yup, it is example@example.com.';

exports.prepareApp = function prepareApp(cb) {  
  test("preparing database and app", function(t) {
    var a = {
      t: t,
      end: function() {
        this.t.test('shutting down server', function(t) {
          app.close();
          t.end();
        });
      
        testUtils.finish(this.t.test.bind(this.t));
        
        this.t.end();
      },
      resolve: function(path) {
        return url.resolve(BASE_URL, path);
      },
      csrf: FAKE_UID,
      testNoAuthRequest: testNoAuthRequest,
      testAuthRequest: testAuthRequest,
      testAuthRequestWithCallback: testAuthRequestWithCallback
    };
    
    testUtils.prepareDatabase(function () {
      app.listen(PORT, function() { cb(a); });
    });
  });
};

function ensureRequest(t, request, method, url, options, assertions) {
  var name = method + ' ' + url;

  return function(cb) {
    var fn = request[method.toLowerCase()];
    fn.call(request, BASE_URL+url, options, function(err, res, body) {
      if (err) return cb(err);
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
      cb(null);
    });
  };
}

function series(t, callbacks) {
  async.series(callbacks, function(err) {
    if (err) throw err;
    t.end();
  });
}

function testNoAuthRequest(method, url, options, assertions) {
  var name = method + ' ' + url;
  var noAuthReq = request.defaults({jar: false});
  
  if (typeof(assertions) == 'undefined') {
    assertions = options;
    options = {};
  }
  
  this.t.test(name, function(t) {
    series(t, [
      ensureRequest(t, noAuthReq, method, url, options, assertions)
    ]);
  });
}

function loginToBackpack(t, request) {
  return ensureRequest(t, request, 'POST', '/backpack/authenticate', {
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
  });
}

function testAuthRequestWithCallback(name, cb) {
  var originalVerify, originalUid;

  function fakeBrowseridVerify(uri, assertion, audience, cb) {
    var expected = FAKE_ASSERTION;
    if (assertion == expected)
      return cb(null, {email: FAKE_EMAIL});
    else
      return cb({type: 'invalid assertion',
                 body: 'expected ' + JSON.stringify(expected) +
                       ' but got ' + JSON.stringify(assertion)}, null);
  };

  function fakeUid() {
    return FAKE_UID;
  };
  
  this.t.test(name, function(t) {
    var authReq = request.defaults({jar: request.jar()});

    originalVerify = browserid.verify;
    originalUid = middleware.utils.uid;
    browserid.verify = fakeBrowseridVerify;
    middleware.utils.uid = fakeUid;
    
    cb(t, authReq);
  });
  
  this.t.test("teardown of auth request test", function(t) {
    browserid.verify = originalVerify;
    middleware.utils.uid = originalUid;
    t.end();
  });
}

function testAuthRequest(method, url, options, assertions) {
  var name = 'authenticated ' + method + ' ' + url;
  
  if (typeof(assertions) == 'undefined') {
    assertions = options;
    options = {};
  }
  
  this.testAuthRequestWithCallback(name, function(t, request) {
    series(t, [
      loginToBackpack(t, request),
      ensureRequest(t, request, method, url, options, assertions)
    ]);
  });
}
