const $ = require('./');
const jws = require('jws');
const test = require('tap').test;
const fs = require('fs');
const path = require('path');
const awardBadge = require('../lib/award');
const mysql = require('../lib/mysql');
const Badge = require('../models/badge');
const BadgeImage = require('../models/badge-image');
const normalize = require('../lib/normalize-assertion');

const TEST_ASSERTION = $.makeAssertion();
const BADGE_DIRECTORY = path.basename(require('../lib/configuration').get('badge_path'));
const PNG_DATA = fs.readFileSync(path.join(__dirname, '/utils/images/no-badge-data.png'));

const NEW_ASSERTION = {
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
};

$.prepareDatabase(function (done) {
  test('awardBadge: old assertion', function (t) {
    const endpoint = 'http://example.com/badge';
    const badgeData = {
      assertion: TEST_ASSERTION,
      url: endpoint,
      imagedata: PNG_DATA,
      recipient: TEST_ASSERTION.recipient
    }

    awardBadge(badgeData, function (err, badge) {
      t.notOk(err, 'should not have an error');
      Badge.find({endpoint: endpoint}, function (err, badges) {
        t.notOk(err, 'should not have an error');
        t.same(badges.length, 1, 'should have exactly one badge');
        const badgePath = badges[0].get('image_path');
        t.ok(badgePath.match(BADGE_DIRECTORY), 'should match');
        t.end();
      });
    })
  });

  test('awardBadge: signed new assertion', function (t) {
    const signature = jws.sign({
      header: {alg: 'rs256'},
      payload: NEW_ASSERTION.structures.assertion,
      privateKey: fs.readFileSync(__dirname + '/rsa-private.pem')
    });

    const normalizedAssertion = normalize(NEW_ASSERTION);
    awardBadge({
      assertion: normalizedAssertion,
      imagedata: PNG_DATA,
      recipient: 'brian@example.org',
      signature: signature
    }, function (err, badge) {
      t.same(signature, badge.get('signature'));
      t.same(normalizedAssertion.uid, badge.getFromAssertion('uid'));

      // get the badge image
      BadgeImage.findOne({ badge_hash: badge.get('body_hash') }, function (err, image) {
        t.same(image.toBuffer(), PNG_DATA);
        t.end();
      })
    });
  });

  $.finish(test);
});
