const appUtils = require('./app-utils');
const issuerUtils = require('./issuer-utils');

appUtils.prepareApp(function(a) {
  issuerUtils.createIssuer(a, function(issuer) {
    a.login();

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

    // Ensure attempting to issue a badge w/o a token fails
    
    a.verifyRequest('POST', '/api/issue', {
      statusCode: 401,
      body: 'access token expected',
      responseHeaders: {
        'www-authenticate': 'Bearer realm="openbadges"'
      }
    });

    // Ensure attempting to issue a badge w/ a token succeeds
    
    a.verifyRequest('POST', '/api/issue', {
      headers: {
        'authorization': 'Bearer 1234'
      }
    }, {
      // TODO: This will change once we actually implement the endpoint!
      statusCode: 501
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

    issuer.end();
    a.end();
  });
});
