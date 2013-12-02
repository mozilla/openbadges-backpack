const $ = require('./');
const jws = require('jws');
const test = require('tap').test;
const fs = require('fs');
const path = require('path');
const bakery = require('openbadges-bakery')
const awardBadge = require('../lib/award');
const Badge = require('../models/badge');
const BadgeImage = require('../models/badge-image');
const normalize = require('../lib/normalize-assertion');
const testImages = require('./test-images')

const TEST_ASSERTION = $.makeAssertion();
const BADGE_DIRECTORY = path.basename(require('../lib/configuration').get('badge_path'));
const PNG_DATA = testImages.png.unbaked
const SVG_DATA = testImages.png.unbaked

$.prepareDatabase(function (done) {
  test('awardBadge: old assertion', function (t) {
    const endpoint = 'http://example.com/badge';
    const badgeData = {
      url: endpoint,
      assertion: TEST_ASSERTION,
      imagedata: PNG_DATA,
      recipient: TEST_ASSERTION.recipient
    }
    t.plan(4)
    awardBadge(badgeData, function (err, badge) {
      t.notOk(err, 'should not have an error');
      const badgeHash = badge.get('body_hash')
      BadgeImage.findOne({ badge_hash: badgeHash }, function (err, image) {
        const bakedImage = image.toBuffer()
        bakery.extract(bakedImage, function (err, result) {
          t.notOk(err, 'no error getting baked data')
          const debakedAssertion = JSON.parse(result)
          t.same(debakedAssertion.verify.url, endpoint, 'has right endpoint')
        })
      })
      Badge.findOne({endpoint: endpoint}, function (err, badge) {
        const badgePath = badge.get('image_path');
        t.ok(badgePath.match(BADGE_DIRECTORY), 'should match');
      });
    })
  });

  test('awardBadge: signed new assertion', function (t) {
    const newAssertion = createNewAssertion()
    const signature = jws.sign({
      header: {alg: 'rs256'},
      payload: newAssertion.structures.assertion,
      privateKey: fs.readFileSync(__dirname + '/rsa-private.pem')
    });
    const normalizedAssertion = normalize(newAssertion);
    awardBadge({
      assertion: normalizedAssertion,
      imagedata: PNG_DATA,
      recipient: 'brian@example.org',
      signature: signature
    }, function (err, badge) {
      t.same(signature, badge.get('signature'));
      t.same(normalizedAssertion.uid, badge.getFromAssertion('uid'));
      const query = { badge_hash: badge.get('body_hash') }
      BadgeImage.findOne(query, function (err, image) {
        const imageData = image.toBuffer()
        t.ok(image.get('baked'), 'image should be baked')
        t.ok(imageData != PNG_DATA, 'badge should be different');
        bakery.extract(imageData, function (err, result) {
          t.notOk(err, 'no errors')
          t.same(result, signature, 'has right signature')
          t.end();
        })
      })
    });
  });

  test('awardBadge: svg badge', function (t) {
    const endpoint = 'http://example.com/badge';
    const newAssertion = createNewAssertion()
    const normalizedAssertion = normalize(newAssertion);

    normalizedAssertion.uid = Date.now()

    awardBadge({
      url: endpoint,
      assertion: normalizedAssertion,
      imagedata: SVG_DATA,
      recipient: 'brian@example.org',
    }, function (err, badge) {
      const query = { badge_hash: badge.get('body_hash') }
      BadgeImage.findOne(query, function (err, image) {
        const imageData = image.toBuffer()
        t.ok(image.get('baked'), 'image should be baked')
        t.ok(imageData != SVG_DATA, 'badge should be different');
        bakery.extract(imageData, function (err, result) {
          t.notOk(err, 'no errors')
          t.end();
        })
      })
    });
  });

  $.finish(test);
});


function createNewAssertion() {
  return {
    version: '1.0.0',
    structures: {
      assertion: {
        "uid": "f2c20",
        "recipient": {
          "type": "email",
          "hashed": true,
          "salt": "deadsea",
          "id": "sha256$c7ef86405ba71b85acd8e2e95166c4b111448089f2e1599f42fe1bba46e865c5"
        },
        "image": "https://example.org/beths-robot-badge.png",
        "evidence": "https://example.org/beths-robot-work.html",
        "issuedOn": 1359217910,
        "badge": "https://example.org/robotics-badge.json",
        "verify": {
          "type": "hosted",
          "url": "https://example.org/beths-robotics-badge.json"
        }
      },
      badge: {
        "name": "Awesome Robotics Badge",
        "description": "For doing awesome things with robots that people think is pretty great.",
        "image": "https://example.org/robotics-badge.png",
        "criteria": "https://example.org/robotics-badge.html",
        "tags": ["robots", "awesome"],
        "issuer": "https://example.org/organization.json",
        "alignment": [
          { "name": "CCSS.ELA-Literacy.RST.11-12.3",
            "url": "http://www.corestandards.org/ELA-Literacy/RST/11-12/3",
            "description": "Follow precisely a complex multistep procedure when carrying out experiments, taking measurements, or performing technical tasks; analyze the specific results based on explanations in the text."
          },
          { "name": "CCSS.ELA-Literacy.RST.11-12.9",
            "url": "http://www.corestandards.org/ELA-Literacy/RST/11-12/9",
            "description": " Synthesize information from a range of sources (e.g., texts, experiments, simulations) into a coherent understanding of a process, phenomenon, or concept, resolving conflicting information when possible."
          }
        ]
      },
      issuer: {
        "name": "An Example Badge Issuer",
        "image": "https://example.org/logo.png",
        "url": "https://example.org/some/path",
        "email": "steved@example.org",
        "revocationList": "https://example.org/revoked.json"
      }
    }
  }
}
