const test = require('tap').test;
const nock = require('nock');
const analyzeAssertion = require('../lib/analyze-assertion');

const ORIGIN = 'https://example.org';
const SCOPE = nock(ORIGIN)
function resetScope() {
  return SCOPE
  .get('/criteria').reply(200, 'criteria')
  .get('/evidence').reply(200, 'evidence')
  .get('/image').reply(200, 'image', { 'content-type': 'image/png' })
}
function makeUrl(path) {
  return ORIGIN + path;
}
function makeAssertion() {
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

test('analyzeAssertion: valid old assertion', function (t) {
  resetScope();
  analyzeAssertion(makeAssertion(), function (err, info) {
    t.notOk(err, 'no errors');
    t.same(info.version, '0.5.0');
    t.end();
  });
});

test('analyzeAssertion: invalid old assertion, bad form', function (t) {
  resetScope();
  const assertion = makeAssertion();
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
  const assertion = makeAssertion();
  assertion.badge.criteria = '/bad-criteria';
  analyzeAssertion(assertion, function (err, info) {
    t.same(err.code, 'resources');
    t.ok(err.extra['badge.criteria'], 'error should be for criteria');
    t.end();
  });
});

test('analyzeAssertion: valid old assertion, url', function (t) {
  const assertion = makeAssertion();
  resetScope()
    .get('/assertion').reply(200, JSON.stringify(assertion), { 'content-type': 'application/json' })
  analyzeAssertion(makeUrl('/assertion'), function (err, info) {
    t.notOk(err, 'no errors');
    t.same(info.version, '0.5.0');
    t.same(info.assertion, assertion);
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
