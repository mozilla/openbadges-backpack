const fs = require('fs');
const jws = require('jws');
const test = require('tap').test;
const nock = require('nock');
const analyzeAssertion = require('../lib/analyze-assertion');

const ORIGIN = 'https://example.org';
const SCOPE = nock(ORIGIN)
const PRIVATE_KEY = fs.readFileSync(__dirname + '/rsa-private.pem');
const PUBLIC_KEY = fs.readFileSync(__dirname + '/rsa-public.pem');
function resetScope() {
  return (
    SCOPE
      .get('/').reply(200, 'root')
      .get('/criteria').reply(200, 'criteria')
      .get('/evidence').reply(200, 'evidence')
      .get('/image').reply(200, 'image', { 'content-type': 'image/png' })
      .get('/public-key').reply(200, PUBLIC_KEY)
      .get('/badge-image').reply(200, 'image', { 'content-type': 'image/png' })
      .get('/assertion-image').reply(200, 'image', { 'content-type': 'image/png' })
      .get('/badge').reply(200, JSON.stringify(makeBadgeClass()))
      .get('/issuer').reply(200, JSON.stringify(makeIssuer()))
  )
}
function makeUrl(path) {
  return ORIGIN + path;
}
function makeOldAssertion() {
  return {
    "recipient": "brian@example.org",
    "evidence": "/evidence",
    "badge": {
      "version": "0.5.0",
      "name": "badge-name",
      "image": '/image',
      "description": "badge-description",
      "criteria": "/criteria",
      "issuer": {
        "origin": ORIGIN,
        "name": "issuer-name",
        "org": "issuer-org",
        "contact": "admin@example.org"
      }
    }
  };
}
function makeNewAssertion() {
  return {
    "badge": "https://example.org/badge",
    "uid": "f2c20",
    "recipient": {
      "type": "email",
      "hashed": true,
      "salt": "deadsea",
      "identity": "sha256$c7ef86405ba71b85acd8e2e95166c4b111448089f2e1599f42fe1bba46e865c5"
    },
    "image": "https://example.org/assertion-image",
    "issuedOn": 1359217910,
    "verify": {
      "type": "hosted",
      "url": "https://example.org/assertion"
    }
  }
}
function makeBadgeClass() {
  return {
    "image": "https://example.org/badge-image",
    "criteria": "https://example.org/criteria",
    "issuer": "https://example.org/issuer",
    "name": "Awesome Robotics Badge",
    "description": "For doing awesome things with robots that people think is pretty great.",
  }
}
function makeIssuer() {
  return {
    "name": "An Example Badge Issuer",
    "url": "https://example.org/",
    "email": "steved@example.org",
  }
}
function makeSignature() {
  const assertion = makeNewAssertion();
  assertion.verify.url = 'https://example.org/public-key';
  assertion.verify.type = 'signed';
  return jws.sign({
    header: { alg: 'rs256' },
    payload: assertion,
    privateKey: PRIVATE_KEY
  });
}

test('analyzeAssertion: valid old assertion', function (t) {
  resetScope();
  analyzeAssertion(makeOldAssertion(), function (err, info) {
    t.notOk(err, 'no errors');
    t.same(info.version, '0.5.0');
    t.end();
  });
});

test('analyzeAssertion: invalid old assertion, bad form', function (t) {
  resetScope();
  const assertion = makeOldAssertion();
  delete assertion.badge.criteria;
  delete assertion.badge.image;
  analyzeAssertion(assertion, function (err, info) {
    t.same(err.code, 'structure');
    t.ok(err.extra['badge.criteria'], 'should have criteria error');
    t.ok(err.extra['badge.image'], 'should have image error');
    t.end();
  });
});

test('analyzeAssertion: invalid old assertion, bad criteria resource', function (t) {
  resetScope()
    .get('/bad-criteria').reply(404)
  const assertion = makeOldAssertion();
  assertion.badge.criteria = '/bad-criteria';
  analyzeAssertion(assertion, function (err, info) {
    t.same(err.code, 'resources');
    t.ok(err.extra['badge.criteria'], 'error should be for criteria');
    t.end();
  });
});

test('analyzeAssertion: valid old assertion, url', function (t) {
  const assertion = makeOldAssertion();
  resetScope()
    .get('/assertion').reply(200, JSON.stringify(assertion), { 'content-type': 'application/json' })
  analyzeAssertion(makeUrl('/assertion'), function (err, info) {
    t.notOk(err, 'no errors');
    t.same(info.version, '0.5.0');
    t.same(info.structures.assertion, assertion);
    t.end();
  });
});

test('analyzeAssertion: url points to nothing', function (t) {
  analyzeAssertion('https://not-a-real-domain.fake', function (err, info) {
    t.same(err.code, 'http-unreachable');
    t.end();
  });
});

test('analyzeAssertion: bad responses', function (t) {
  resetScope()
    .get('/404').reply(404)
    .get('/500').reply(500)
  t.plan(4);
  analyzeAssertion(makeUrl('/404'), function (err, info) {
    t.same(err.code, 'http-status');
    t.same(err.extra, 404);
  });
  analyzeAssertion(makeUrl('/500'), function (err, info) {
    t.same(err.code, 'http-status');
    t.same(err.extra, 500);
  });
});

test('analyzeAssertion: malformed url', function (t) {
  analyzeAssertion('something not a url', function (err, info) {
    t.same(err.name, 'TypeError');
    t.end();
  });
});

test('analyzeAssertion: new assertion, hosted', function (t) {
  const assertion = makeNewAssertion();
  resetScope()
    .get('/assertion').reply(200, JSON.stringify(assertion))
  analyzeAssertion(assertion, function (err, info) {
    t.notOk(err, 'no errors')
    t.same(info.version, '1.0.0');
    t.same(info.structures.assertion, assertion);
    t.end();
  });
});

test('analyzeAssertion: new assertion, signed', function (t) {
  const signature = makeSignature();
  analyzeAssertion(signature, function (err, info) {
    t.notOk(err, 'no errors');
    t.same(info.version, '1.0.0');
    t.same(signature, info.signature);
    t.same(info.structures.assertion.uid, 'f2c20');
    t.end();
  });
});

