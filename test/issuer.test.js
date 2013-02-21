const appUtils = require('./app-utils');

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

appUtils.prepareApp(function(a) {
  var ERR_404_URL = a.resolve('/404');
  var BAD_IMG_BADGE_URL = a.resolve('/test/assertions/bad_img.json');
  var EXAMPLE_BADGE_URL = a.resolve('/test/assertions/example.json');
  
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
});
