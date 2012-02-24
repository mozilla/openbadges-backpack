var loginUtils = require('./login-utils'),
    assert = require('assert');

var app = loginUtils.startApp();
var suite = loginUtils.suite('issuer api');

const EXAMPLE_BADGE = {
  "recipient": "example@example.com",
  "evidence": "/badges/html5-basic/example",
  "badge": {
    "version": "0.5.0",
    "name": "HTML5 Fundamental",
    "image": "/_demo/cc.large.png",
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

const EXAMPLE_BADGE_URL = suite.url('/test/assertions/example.json');

suite
  .discuss('when not logged in')
    .path('/issuer/frame')
      .get().expect(200).unpath()
    .path('/issuer.js')
      .get().expect(200).unpath()
    .path('/issuer/assertion')
      .get().expect(403)
      .postFormData().expect(403)
    .unpath()
    .undiscuss().next()
  .discuss('when logged in')
    .login()
    .path('/issuer/assertion')
      .discuss('and providing no "url" argument')
        .get().expect(400)
        .postFormData().expect(400)
        .undiscuss()
      .discuss('and providing a malformed url')
        .get({url: 'LOLOL'}).expect(400)
        .postFormData({url: 'LOLOL'}).expect(400)
        .undiscuss()
      .discuss('and providing an unreachable url')
        // TODO: Should these be returning 502 Bad Gateway instead?
        // the .get test thing doesn't seem to want to include query string?
        .get("?url=" + suite.url('/does/not/exist')).expect(404)
        .postFormData({url: suite.url('/does/not/exist')}).expect(404)
        .undiscuss()
      .discuss('and providing a valid url')
        // Make sure the example badge isn't already in their backpack.
        .delFormData({url: EXAMPLE_BADGE_URL}).next()
        .discuss('that the user does not have in their backpack')
          .get("?url=" + EXAMPLE_BADGE_URL)
            .expect(200, {
              exists: false,
              badge: EXAMPLE_BADGE
            })
          .postFormData({url: EXAMPLE_BADGE_URL})
            .expect(200)
            .next()
          .undiscuss()
        .discuss('that the user already has in their backpack')
          .postFormData({url: EXAMPLE_BADGE_URL})
            .expect(400)
          .get("?url="+EXAMPLE_BADGE_URL)
            .expect(200, {
              exists: true,
              badge: EXAMPLE_BADGE
            })
          .next()
          .delFormData({url: EXAMPLE_BADGE_URL}).expect(200)
          .next()
          .undiscuss();
          
suite.export(module);
