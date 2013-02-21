const appUtils = require('./app-utils');
const express = require('express');
const http = require('http');

appUtils.prepareApp(function(a) {
  var PORT = 9000;
  var BASE_URL = 'http://localhost:' + PORT;
  var BAD_IMG_BADGE_URL = BASE_URL + '/bad_img';
  var EXAMPLE_BADGE_URL = BASE_URL + '/example';
  var BAD_IMG_BADGE = {
    "recipient": "sha256$4817f7f2b03fb83c669a56ed1212047a8d9ca294aaf7a01c569de070dfb3fe8b",
    "salt": "ballertime",
    "evidence": "/badges/html5-basic/example",
    "badge": {
      "version": "0.5.0",
      "name": "HTML5 Fundamental",
      "image": "/CANT_BE_REACHED.png",
      "description": "Knows the difference between a <section> and a blah",
      "criteria": "/badges/html5-basic",
      "issuer": {
        "origin": BASE_URL,
        "name": "P2PU",
        "org": "School of Webcraft",
        "contact": "admin@p2pu.org"
     }
    }
  };
  var EXAMPLE_BADGE = {
    "recipient": "sha256$4817f7f2b03fb83c669a56ed1212047a8d9ca294aaf7a01c569de070dfb3fe8b",
    "salt": "ballertime",
    "evidence": "/badges/html5-basic/example",
    "badge": {
      "version": "0.5.0",
      "name": "HTML5 Fundamental",
      "image": a.resolve('/_demo/cc.large.png'),
      "description": "Knows the difference between a <section> and a blah",
      "criteria": "/badges/html5-basic",
      "issuer": {
        "origin": BASE_URL,
        "name": "P2PU",
        "org": "School of Webcraft",
        "contact": "admin@p2pu.org"
     }
    }
  };
  
  var issuerApp = express();
  
  issuerApp.get('/bad_img', function(req, res) {
    return res.send(BAD_IMG_BADGE);
  });
  
  issuerApp.get('/example', function(req, res) {
    return res.send(EXAMPLE_BADGE);
  });

  issuerApp = http.createServer(issuerApp);
  
  issuerApp.listen(PORT, function() {
    // Ensure assertions w/ bad image URLs raise errors.

    a.testAuthRequest('GET', '/issuer/assertion?url=' + BAD_IMG_BADGE_URL, {
      statusCode: 502,
      body: /trying to grab image.*unreachable/i
    });
    
    a.testAuthRequest('POST', '/issuer/assertion', {
      form: {
        '_csrf': a.csrf,
        'url': BAD_IMG_BADGE_URL
      }
    }, {
      statusCode: 502,
      body: /trying to grab image.*unreachable/i
    });
  
    // Ensure the example badge isn't in the user's backpack.

    a.testAuthRequest('GET', '/issuer/assertion?url=' + EXAMPLE_BADGE_URL, {
      statusCode: 200,
      body: {
        owner:  true,
        exists: false,
        recipient: 'example@example.com',
        badge: EXAMPLE_BADGE
      }
    });

    // Now put the example badge in the user's backpack.
  
    a.testAuthRequest('POST', '/issuer/assertion', {
      form: {
        '_csrf': a.csrf,
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

    a.testAuthRequest('POST', '/issuer/assertion', {
      form: {
        '_csrf': a.csrf,
        'url': EXAMPLE_BADGE_URL
      }
    }, {
      statusCode: 304
    });
  
    // Now ensure that the example badge is in the user's backpack.
  
    a.testAuthRequest('GET', '/issuer/assertion?url=' + EXAMPLE_BADGE_URL, {
      statusCode: 200,
      body: {
        owner:  true,
        exists: true,
        recipient: 'example@example.com',
        badge: EXAMPLE_BADGE
      }
    });
    
    a.t.test("shut down issuer server", function(t) {
      issuerApp.close();
      t.end();
    });
    
    a.end();
  });
});

appUtils.prepareApp(function(a) {
  var ERR_404_URL = a.resolve('/404');
  
  a.testNoAuthRequest('GET', '/issuer/frame', {statusCode: 200});
  a.testNoAuthRequest('GET', '/issuer.js', {statusCode: 200});
  a.testNoAuthRequest('GET', '/issuer/assertion', {statusCode: 403});
  a.testNoAuthRequest('POST', '/issuer/assertion', {statusCode: 403});

  a.testAuthRequest('GET', '/issuer/assertion', {
    statusCode: 400,
    body: {'message': 'url is a required param'}
  });

  // Ensure POSTing to the endpoint while logged-in w/o a csrf token fails.
  a.testAuthRequest('POST', '/issuer/assertion', {statusCode: 403});

  a.testAuthRequest('POST', '/issuer/assertion', {
    form: {'_csrf': a.csrf}
  }, {
    statusCode: 400,
    body: {'message': 'url is a required param'}
  });

  // Ensure assertions w/ malformed URLs raise errors.
  
  a.testAuthRequest('GET', '/issuer/assertion?url=LOL', {
    statusCode: 400,
    body: {'message': 'malformed url'}
  });

  a.testAuthRequest('POST', '/issuer/assertion', {
    form: {'_csrf': a.csrf, 'url': 'LOL'}
  }, {
    statusCode: 400,
    body: {'message': 'malformed url'}
  });

  // Ensure unreachable assertions raise errors.

  a.testAuthRequest('GET', '/issuer/assertion?url=' + ERR_404_URL, {
    statusCode: 502,
    body: /unreachable/i
  });

  a.testAuthRequest('POST', '/issuer/assertion', {
    form: {
      '_csrf': a.csrf,
      'url': ERR_404_URL
    }
  }, {
    statusCode: 502,
    body: /unreachable/i
  });
  
  a.end();
});
