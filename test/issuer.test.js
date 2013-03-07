const appUtils = require('./app-utils');
const issuerUtils = require('./issuer-utils');

appUtils.prepareApp(function(a) {
  issuerUtils.createIssuer(a, function(issuer) {
    var BAD_IMG_URL = issuer.resolve('/bad_img');
    var EXAMPLE_URL = issuer.resolve('/example');
    var BAD_ASSERTION_URL = issuer.resolve('/bad_assertion');

    a.login();

    // Ensure assertions w/ bad image URLs raise errors.
    a.verifyRequest('GET', '/issuer/assertion?url=' + BAD_IMG_URL, {
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
        'url': BAD_IMG_URL
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
    a.verifyRequest('GET', '/issuer/assertion?url=' + BAD_ASSERTION_URL, {
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
    a.verifyRequest('GET', '/issuer/assertion?url=' + EXAMPLE_URL, {
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
        'url': EXAMPLE_URL
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
        'url': EXAMPLE_URL
      }
    }, {
      statusCode: 304
    });

    // Now ensure that the example badge is in the user's backpack.
    a.verifyRequest('GET', '/issuer/assertion?url=' + EXAMPLE_URL, {
      statusCode: 200,
      body: {
        owner:  true,
        exists: true,
        recipient: a.email,
        badge: issuer.BADGES['/example']
      }
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
    body: {'message': 'url is a required param'}
  });

  // Ensure POSTing to the endpoint while logged-in w/o a csrf token fails.
  a.verifyRequest('POST', '/issuer/assertion', {statusCode: 403});

  a.verifyRequest('POST', '/issuer/assertion', {
    form: {'_csrf': a.csrf}
  }, {
    statusCode: 400,
    body: {'message': 'url is a required param'}
  });

  // // Ensure assertions w/ malformed URLs raise errors.
  a.verifyRequest('GET', '/issuer/assertion?url=LOL', {
    statusCode: 400,
    body: {'message': 'malformed url'}
  });

  a.verifyRequest('POST', '/issuer/assertion', {
    form: {'_csrf': a.csrf, 'url': 'LOL'}
  }, {
    statusCode: 400,
    body: {'message': 'malformed url'}
  });

  // Ensure unreachable assertions raise errors.
  a.verifyRequest('GET', '/issuer/assertion?url=' + ERR_404_URL, {
    statusCode: 400,
    body: /could not get assertion/i
  });

  a.verifyRequest('POST', '/issuer/assertion', {
    form: {
      '_csrf': a.csrf,
      'url': ERR_404_URL
    }
  }, {
    statusCode: 400,
    body: /could not get assertion/i
  });

  a.end();
});
