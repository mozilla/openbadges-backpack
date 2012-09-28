/*var loginUtils = require('./login-utils'),
    assert = require('assert'),
    validator = require('validator');

var app = loginUtils.startApp();
var suite = loginUtils.suite('issuer api');
var mysql = require("../lib/mysql");

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

const EXAMPLE_BADGE_URL = suite.url('/test/assertions/example.json');
const BAD_IMG_BADGE_URL = suite.url('/test/assertions/bad_img.json');

validator.check = (function acceptLocalURLs() {
  var oldCheck = validator.check;
  
  return function(url) {
    if (url.indexOf(suite.url('/')) == 0)
      return {isUrl: function() {}};
    return oldCheck.apply(validator, arguments);
  }
})();

suite
  .addBatch({
    'setup': {
      topic: function () {
        console.warn("@@@");
        mysql.prepareTesting(this.callback);
      }
    }
  })  
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
        // TODO: Not sure why, but we need this next() here or else
        // bad things happen if the tests are executed in parallel.
        .next()
        .postFormData().expect(400)
        .undiscuss()
      .discuss('and providing a malformed url')
        .get({url: 'LOLOL'}).expect(400)
        .postFormData({url: 'LOLOL'}).expect(400)
        .undiscuss()
      .discuss('and providing an unreachable url')
        // the .get test thing doesn't seem to want to include query string?
        .get("?url=" + suite.url('/does/not/exist')).expect(502)
        .expect("provides an appropriate error message", function(err, res) {
          var message = JSON.parse(res.body).message;
          assert.ok(message.match(/unreachable/i));
        })
        .postFormData({url: suite.url('/does/not/exist')}).expect(502)
        .undiscuss()
      .discuss('and providing a valid url')
        .discuss('with an unreachable image')
          .get("?url=" + BAD_IMG_BADGE_URL)
            .expect(502)
            .expect("provides an appropriate error message", function(err, res) {
              var message = JSON.parse(res.body).message;
              assert.ok(message.match(/image.*unreachable/i));
            })
          .undiscuss()
        .discuss('that the user does not have in their backpack')
          // FIXME: this test is failing, not sure why
          .get("?url=" + EXAMPLE_BADGE_URL)
            .expect(200, {
              owner:  true,
              exists: false,
              recipient: 'example@example.com',
              badge: EXAMPLE_BADGE
            })
          .next()
          .postFormData({url: EXAMPLE_BADGE_URL})
            .expect(201)
            .next()
          .undiscuss()
        .discuss('that the user already has in their backpack')
          .postFormData({url: EXAMPLE_BADGE_URL})
            .expect(304)
          .get("?url="+EXAMPLE_BADGE_URL)
            .expect(200, {
              owner: true,
              exists: true,
              recipient: 'example@example.com',
              badge: EXAMPLE_BADGE
            })
          .next()
          .undiscuss();
suite.export(module);*/
