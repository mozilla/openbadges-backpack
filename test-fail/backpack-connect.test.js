const appUtils = require('./app-utils');
const issuerUtils = require('./issuer-utils');
const b64enc = function(s) { return new Buffer(s).toString('base64'); };

function setupDifferentIssuer(issuer, path, origin) {
  var badge = JSON.parse(JSON.stringify(issuer.BADGES['/example']));

  badge.badge.issuer.origin = origin;
  issuer.app.get(path, function(req, res) { return res.send(badge); });
}

appUtils.prepareApp(function(a) {
  issuerUtils.createIssuer(a, function(issuer) {
    setupDifferentIssuer(issuer, '/different', 'http://different.org');

    // Ensure CORS OPTIONS requests work.

    a.verifyRequest('OPTIONS', '/api/foo', {
      statusCode: 200,
      responseHeaders: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'Content-Type, Authorization',
        'access-control-expose-headers': 'WWW-Authenticate'
      }
    });

    a.login();

    // Ensure a request to revoke-origin w/o a CSRF fails.

    a.verifyRequest('POST', '/backpack/settings/revoke-origin', {
      form: {origin: 'http://foo.org'}
    }, {
      statusCode: 403
    });

    // Ensure a request to revoke-origin w/ a CSRF works.

    a.verifyRequest('POST', '/backpack/settings/revoke-origin', {
      form: {_csrf: a.csrf, origin: 'http://foo.org'}
    }, {
      statusCode: 204
    });

    // Ensure a request w/o a CSRF fails.

    a.verifyRequest('POST', '/accept', {
      form: {
        'callback': issuer.resolve('/callback'),
        'scope': 'issue'
      }
    }, {
      statusCode: 403
    });

    // Ensure a request w/ a CSRF succeeds and gives us a token.

    a.verifyRequest('POST', '/accept', {
      form: {
        '_csrf': a.csrf,
        'callback': issuer.resolve('/callback'),
        'scope': 'issue'
      }
    }, {
      statusCode: 303,
      responseHeaders: {
        location: issuer.resolve('/callback') +
                  '?access_token=1234&refresh_token=1234' +
                  '&expires=3600&api_root=' +
                  encodeURIComponent(a.resolve('/api'))
      }
    });

    // Log out to ensure that this all works w/o any cookies.

    a.verifyRequest('GET', '/backpack/signout', {statusCode: 200});

    // Ensure attempting to issue a badge w/o a token fails

    a.verifyRequest('POST', '/api/issue', {
      statusCode: 401,
      body: 'access token expected',
      responseHeaders: {
        'www-authenticate': 'Bearer realm="openbadges"'
      }
    });

    // Ensure attempting to issue a badge w/ a token but no URL fails.

    a.verifyRequest('POST', '/api/issue', {
      headers: {
        'authorization': 'Bearer ' + b64enc('1234')
      }
    }, {
      statusCode: 400,
      body: {message: 'must provide either url or signature'}
    });

    // Ensure attempting to issue a badge w/ a valid URL succeeds.

    a.verifyRequest('POST', '/api/issue', {
      headers: {
        'authorization': 'Bearer ' + b64enc('1234')
      },
      form: {
        'badge': issuer.resolve('/example')
      }
    }, {
      statusCode: 201,
      body: {
        'exists': false,
        'badge': issuer.BADGES['/example']
      }
    });

    // Ensure attempting to issue a badge from a bad CORS origin fails.

    a.verifyRequest('POST', '/api/issue', {
      headers: {
        'authorization': 'Bearer ' + b64enc('1234'),
        'origin': 'http://blah.org'
      }
    }, {
      statusCode: 401,
      responseHeaders: {'access-control-allow-origin': issuer.BASE_URL},
      body: 'invalid origin'
    });

    // Ensure attempting to issue a badge from a good CORS origin succeeds.

    a.verifyRequest('POST', '/api/issue', {
      headers: {
        'authorization': 'Bearer ' + b64enc('1234'),
        'origin': issuer.BASE_URL
      },
      form: {
        'badge': issuer.resolve('/example')
      }
    }, {
      statusCode: 304,
      responseHeaders: {'access-control-allow-origin': issuer.BASE_URL}
    });

    // Ensure attempting to issue a badge w/ a different issuer fails.

    a.verifyRequest('POST', '/api/issue', {
      headers: {
        'authorization': 'Bearer ' + b64enc('1234')
      },
      form: {
        'badge': issuer.resolve('/different')
      }
    }, {
      statusCode: 400,
      body: {
        'message': 'issuer origin must be identical to bearer token origin'
      }
    });

    // Ensure refreshing the wrong token fails

    a.verifyRequest('POST', '/api/token', {
      form: {
        'grant_type': 'refresh_token',
        'refresh_token': 'BAD'
      }
    }, {
      statusCode: 400,
      body: 'invalid refresh_token'
    });

    // Ensure refreshing the token works

    a.verifyRequest('POST', '/api/token', {
      form: {
        'grant_type': 'refresh_token',
        'refresh_token': '1234'
      }
    }, {
      statusCode: 200,
      body: {
        expires: '3600',
        access_token: '1234',
        refresh_token: '1234'
      }
    });

    // Ensure refreshing the token from a bad origin over CORS fails

    a.verifyRequest('POST', '/api/token', {
      headers: {'origin': 'http://blarg.org'},
      form: {
        'grant_type': 'refresh_token',
        'refresh_token': '1234'
      }
    }, {
      statusCode: 401,
      responseHeaders: {'access-control-allow-origin': issuer.BASE_URL},
      body: 'invalid origin'
    });

    // Ensure refreshing the token from a good origin over CORS fails

    a.verifyRequest('POST', '/api/token', {
      headers: {'origin': issuer.BASE_URL},
      form: {
        'grant_type': 'refresh_token',
        'refresh_token': '1234'
      }
    }, {
      statusCode: 200,
      responseHeaders: {'access-control-allow-origin': issuer.BASE_URL}
    });

    // Ensure the hash endpoint works.
    
    a.verifyRequest('GET', '/api/identity', {
      headers: {
        'authorization': 'Bearer ' + b64enc('1234')
      }
    }, {
      statusCode: 200,
      body: {
        recipient: 'sha256$2a5712a82a3bc8f7ce25fe686ead768b5a538f5c248' +
                   '2214addee66a4ae29e2f8',
        salt: '1234',
        type: 'email'
      }
    });

    // Ensure the hash endpoint requires auth.
    
    a.verifyRequest('GET', '/api/identity', {
      statusCode: 401,
      body: 'access token expected'
    });

    issuer.end();
    a.end();
  });
});
