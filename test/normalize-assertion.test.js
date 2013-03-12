const $ = require('./');
const test = require('tap').test;
const normalize = require('../lib/normalize-assertion');

const OLD_ASSERTION = {
  version: '0.5.0',
  structures: {
    assertion: {
      noop: true
    }
  }
};
const NEW_ASSERTION = {
  version: '1.0.0',
  structures: {
    assertion: {
      "uid": "f2c20",
      "recipient": {
        "type": "email",
        "hashed": true,
        "salt": "deadsea",
        "identity": "sha256$c7ef86405ba71b85acd8e2e95166c4b111448089f2e1599f42fe1bba46e865c5"
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

const EXPECTATION = {
  uid: "f2c20",
  recipient: "sha256$c7ef86405ba71b85acd8e2e95166c4b111448089f2e1599f42fe1bba46e865c5",
  "_originalRecipient": {
    "type": "email",
    "hashed": true,
    "salt": "deadsea",
    "identity": "sha256$c7ef86405ba71b85acd8e2e95166c4b111448089f2e1599f42fe1bba46e865c5"
  },
  salt: "deadsea",
  image: "https://example.org/beths-robot-badge.png",
  evidence: "https://example.org/beths-robot-work.html",
  issuedOn: 1359217910,
  issued_on: 1359217910,
  "verify": {
    "type": "hosted",
    "url": "https://example.org/beths-robotics-badge.json"
  },
  badge: {
    "_location": "https://example.org/robotics-badge.json",
    "name": "Awesome Robotics Badge",
    "description": "For doing awesome things with robots that people think is pretty great.",
    "image": "https://example.org/robotics-badge.png",
    "criteria": "https://example.org/robotics-badge.html",
    "tags": ["robots", "awesome"],
    "alignment": [
      { "name": "CCSS.ELA-Literacy.RST.11-12.3",
        "url": "http://www.corestandards.org/ELA-Literacy/RST/11-12/3",
        "description": "Follow precisely a complex multistep procedure when carrying out experiments, taking measurements, or performing technical tasks; analyze the specific results based on explanations in the text."
      },
      { "name": "CCSS.ELA-Literacy.RST.11-12.9",
        "url": "http://www.corestandards.org/ELA-Literacy/RST/11-12/9",
        "description": " Synthesize information from a range of sources (e.g., texts, experiments, simulations) into a coherent understanding of a process, phenomenon, or concept, resolving conflicting information when possible."
      }
    ],
    issuer: {
      "_location": "https://example.org/organization.json",
      "name": "An Example Badge Issuer",
      "image": "https://example.org/logo.png",
      "url": "https://example.org/some/path",
      "origin": "https://example.org",
      "email": "steved@example.org",
      "revocationList": "https://example.org/revoked.json"
    }
  }
};

test('normalize: old assertion', function (t) {
  t.same(normalize(OLD_ASSERTION),
         OLD_ASSERTION.structures.assertion,
         'should be a no operation for old assertions');
  t.end();
});

test('normalize: new assertion', function (t) {
  t.same(normalize(NEW_ASSERTION),
         EXPECTATION,
         'should have transformed the new assertion');
  t.end();
});

