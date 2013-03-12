const $ = require('./');
const appUtils = require('./app-utils');
const issuerUtils = require('./issuer-utils');

appUtils.prepareApp(function(a) {
  issuerUtils.createIssuer(a, function(issuer) {
    var BAD_IMG_URL = issuer.resolve('/bad_img');
    var EXAMPLE_URL = issuer.resolve('/example');
    var BAD_ASSERTION_URL = issuer.resolve('/bad_assertion');
    var GOOD_SIGNATURE = $.makeSignature({email: a.email, resolve: issuer.resolve});
    var BAD_SIGNATURE = $.makeBadSignature('some garbage');

    a.login();

    // Ensure assertions w/ bad image URLs raise errors.
    a.verifyRequest('GET', '/issuer/assertion?assertion=' + BAD_IMG_URL, {
      statusCode: 400,
      body: function (t, body) {
        body = JSON.parse(body);
        t.same(body.code, 'resources');
        t.ok(body.extra['badge.image'], 'should be a badge image error');
        t.same(body.extra['badge.image'].code, 'http-status');
        t.same(body.extra['badge.image'].received, 404);
      }
    });

    a.verifyRequest('POST', '/issuer/assertion', {
      form: {
        '_csrf': a.csrf,
        'assertion': BAD_IMG_URL
      }
    }, {
      statusCode: 400,
      body: function (t, body) {
        body = JSON.parse(body);
        t.same(body.code, 'resources');
        t.ok('badge.image' in body.extra, 'should be a badge image error');
        t.same(body.extra['badge.image'].code, 'http-status');
        t.same(body.extra['badge.image'].received, 404);
      }
    });

    // Ensure bad assertions get reported correctly
    a.verifyRequest('GET', '/issuer/assertion?assertion=' + BAD_ASSERTION_URL, {
      statusCode: 400,
      body: function (t, body) {
        body = JSON.parse(body);
        t.same(body.code, 'structure');
        t.ok('recipient' in body.extra, 'should be a recipient error');
        t.ok('badge.name' in body.extra, 'should have badge name error');
        t.ok('badge.issuer.origin' in body.extra, 'should have an origin error');
      }
    });


    // Ensure the example badge isn't in the user's backpack.
    a.verifyRequest('GET', '/issuer/assertion?assertion=' + EXAMPLE_URL, {
      statusCode: 200,
      body: {
        owner:  true,
        exists: false,
        recipient: a.email,
        badge: issuer.BADGES['/example']
      }
    });

    // Now put the example badge in the user's backpack.
    a.verifyRequest('POST', '/issuer/assertion', {
      form: {
        '_csrf': a.csrf,
        'assertion': EXAMPLE_URL
      }
    }, {
      statusCode: 201,
      body: {
        'exists': false,
        badge: issuer.BADGES['/example']
      }
    });

    // Ensure putting the example badge in the user's backpack again results
    // in a 304 Not Modified.
    a.verifyRequest('POST', '/issuer/assertion', {
      form: {
        '_csrf': a.csrf,
        'assertion': EXAMPLE_URL
      }
    }, {
      statusCode: 304
    });

    // Now ensure that the example badge is in the user's backpack.
    a.verifyRequest('GET', '/issuer/assertion?assertion=' + EXAMPLE_URL, {
      statusCode: 200,
      body: {
        owner:  true,
        exists: true,
        recipient: a.email,
        badge: issuer.BADGES['/example']
      }
    });

    // signed badges!
    a.verifyRequest('GET', '/issuer/assertion?assertion=' + GOOD_SIGNATURE, {
      statusCode: 200,
      body: function (t, body) {
        body = JSON.parse(body)
        t.same(body.badge.recipient, body.badge._originalRecipient.identity)
      }
    });

    a.verifyRequest('POST', '/issuer/assertion', {
      form: {
        '_csrf': a.csrf,
        'assertion': GOOD_SIGNATURE
      }
    }, { statusCode: 201, });

    a.verifyRequest('GET', '/issuer/assertion?assertion=' + BAD_SIGNATURE, {
      statusCode: 400,
      body: /malformed/i
    });

    issuer.end();
    a.end();
  });
});

appUtils.prepareApp(function(a) {
  var ERR_404_URL = a.resolve('/404');

  a.verifyRequest('GET', '/issuer/frame', {statusCode: 200});
  a.verifyRequest('GET', '/issuer.js', {statusCode: 200});
  a.verifyRequest('GET', '/issuer/assertion', {statusCode: 403});
  a.verifyRequest('POST', '/issuer/assertion', {statusCode: 403});

  a.login();

  a.verifyRequest('GET', '/issuer/assertion', {
    statusCode: 400,
    body: {'message': 'must provide either url or signature'}
  });

  // Ensure POSTing to the endpoint while logged-in w/o a csrf token fails.
  a.verifyRequest('POST', '/issuer/assertion', {statusCode: 403});

  a.verifyRequest('POST', '/issuer/assertion', {
    form: {'_csrf': a.csrf}
  }, {
    statusCode: 400,
    body: {'message': 'must provide either url or signature'}
  });

  // Ensure assertions w/ malformed URLs raise errors.
  a.verifyRequest('GET', '/issuer/assertion?assertion=LOL', {
    statusCode: 400,
    body: {'message': 'malformed assertion, must be a url or signature'}
  });

  a.verifyRequest('POST', '/issuer/assertion', {
    form: {'_csrf': a.csrf, 'assertion': 'LOL'}
  }, {
    statusCode: 400,
    body: {'message': 'malformed assertion, must be a url or signature'}
  });

  // Ensure unreachable assertions raise errors.
  a.verifyRequest('GET', '/issuer/assertion?assertion=' + ERR_404_URL, {
    statusCode: 400,
    body: /404/i
  });

  a.verifyRequest('POST', '/issuer/assertion', {
    form: {
      '_csrf': a.csrf,
      'assertion': ERR_404_URL
    }
  }, {
    statusCode: 400,
    body: /404/i
  });

  a.end();
});
