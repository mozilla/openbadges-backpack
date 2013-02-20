const test = require('tap').test;
const testUtils = require('./');
const app = require('../app');
const request = require('request');
const async = require('async');
const browserid = require('../lib/browserid');
const middleware = require('../middleware');

const PORT = 8889;
const BASE_URL = 'http://localhost:' + PORT;

module.exports = {
  FAKE_EMAIL: 'example@example.com',
  FAKE_ASSERTION: 'yup, it is example@example.com.',
  FAKE_UID: '1234',
};

function prepareApp(cb) {
  testUtils.prepareDatabase(function () {
    app.listen(PORT, function() {
      cb();

      test('shutting down server', function(t) {
        app.close();
        t.end();
      });
      
      testUtils.finish(test);
    });
  });
}

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
  
  test(name, function(t) {
    series(t, [
      ensureRequest(t, noAuthReq, method, url, options, assertions)
    ]);
  });
}

function loginToBackpack(t, request) {
  return ensureRequest(t, request, 'POST', '/backpack/authenticate', {
    form: {
      '_csrf': module.exports.FAKE_UID,
      'assertion': module.exports.FAKE_ASSERTION
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
  
  test(name, function(t) {
    var authReq = request.defaults({jar: request.jar()});

    originalVerify = browserid.verify;
    originalUid = middleware.utils.uid;
    browserid.verify = fakeBrowseridVerify;
    middleware.utils.uid = fakeUid;
    
    cb(t, authReq);
  });
  
  test("teardown of auth request test", function(t) {
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
  
  testAuthRequestWithCallback(name, function(t, request) {
    series(t, [
      loginToBackpack(t, request),
      ensureRequest(t, request, method, url, options, assertions)
    ]);
  });
}

prepareApp(function() {
  testNoAuthRequest('GET', '/issuer/frame', {statusCode: 200});
  testNoAuthRequest('GET', '/issuer.js', {statusCode: 200});
  testNoAuthRequest('GET', '/issuer/assertion', {statusCode: 403});
  testNoAuthRequest('POST', '/issuer/assertion', {statusCode: 403});

  testAuthRequest('GET', '/issuer/assertion', {
    statusCode: 400,
    body: {'message': 'url is a required param'}
  });

  // Ensure POSTing to the endpoint while logged-in w/o a csrf token fails.
  testAuthRequest('POST', '/issuer/assertion', {statusCode: 403});

  testAuthRequest('POST', '/issuer/assertion', {
    form: {'_csrf': module.exports.FAKE_UID}
  }, {
    statusCode: 400,
    body: {'message': 'url is a required param'}
  });

  // Ensure assertions w/ malformed URLs raise errors.
  
  testAuthRequest('GET', '/issuer/assertion?url=LOL', {
    statusCode: 400,
    body: {'message': 'malformed url'}
  });

  testAuthRequest('POST', '/issuer/assertion', {
    form: {'_csrf': module.exports.FAKE_UID, 'url': 'LOL'}
  }, {
    statusCode: 400,
    body: {'message': 'malformed url'}
  });

  // Ensure unreachable assertions raise errors.
  
  testAuthRequest('GET', '/issuer/assertion?url=' + BASE_URL + '/404', {
    statusCode: 502,
    body: /unreachable/i
  });

  testAuthRequest('POST', '/issuer/assertion', {
    form: {
      '_csrf': module.exports.FAKE_UID,
      'url': BASE_URL + '/404'
    }
  }, {
    statusCode: 502,
    body: /unreachable/i
  });

  // Ensure assertions w/ bad image URLs raise errors.
  
  var BAD_IMG_BADGE_URL = BASE_URL + '/test/assertions/bad_img.json';

  testAuthRequest('GET', '/issuer/assertion?url=' + BAD_IMG_BADGE_URL, {
    statusCode: 502,
    body: /trying to grab image.*unreachable/i
  });
    
  testAuthRequest('POST', '/issuer/assertion', {
    form: {
      '_csrf': module.exports.FAKE_UID,
      'url': BAD_IMG_BADGE_URL
    }
  }, {
    statusCode: 502,
    body: /trying to grab image.*unreachable/i
  });
  
  var EXAMPLE_BADGE_URL = BASE_URL + '/test/assertions/example.json';
  const EXAMPLE_BADGE = {
    "recipient": "sha256$4817f7f2b03fb83c669a56ed1212047a8d9ca294aaf7a01c569de070dfb3fe8b",
    "salt": "ballertime",
    "evidence": "/badges/html5-basic/example",
    "badge": {
      "version": "0.5.0",
      "name": "HTML5 Fundamental",
      "image": "https://github.com/mozilla/openbadges/raw/development/static/images/demo-badge.png",
      "description": "Knows the difference between a <section> and an <article>",
      "criteria": "/badges/html5-basic",
      "issuer": {
        "origin": "http://p2pu.org",
        "name": "P2PU",
        "org": "School of Webcraft",
        "contact": "admin@p2pu.org"
     }
    }
  };
  
  // Ensure the example badge isn't in the user's backpack.

  testAuthRequest('GET', '/issuer/assertion?url=' + EXAMPLE_BADGE_URL, {
    statusCode: 200,
    body: {
      owner:  true,
      exists: false,
      recipient: 'example@example.com',
      badge: EXAMPLE_BADGE
    }
  });

  // Now put the example badge in the user's backpack.
  
  testAuthRequest('POST', '/issuer/assertion', {
    form: {
      '_csrf': module.exports.FAKE_UID,
      'url': EXAMPLE_BADGE_URL
    }
  }, {
    statusCode: 201,
    body: {
      'exists': false,
      badge: EXAMPLE_BADGE
    }
  });
  
  // Ensure putting the example badge in the user's backpack again results
  // in a 304 Not Modified.

  testAuthRequest('POST', '/issuer/assertion', {
    form: {
      '_csrf': module.exports.FAKE_UID,
      'url': EXAMPLE_BADGE_URL
    }
  }, {
    statusCode: 304
  });
  
  // Now ensure that the example badge is in the user's backpack.
  
  testAuthRequest('GET', '/issuer/assertion?url=' + EXAMPLE_BADGE_URL, {
    statusCode: 200,
    body: {
      owner:  true,
      exists: true,
      recipient: 'example@example.com',
      badge: EXAMPLE_BADGE
    }
  });
});
