const $ = require('./');
const test = require('tap').test;
const browserid = require('../lib/browserid');

const ASSERTION = '1234';
const AUDIENCE = 'localhost';

test('verify: good verifier response', function (t) {
  $.mockHttp()
    .post('/good', { assertion: ASSERTION, audience: AUDIENCE })
    .reply(200, {status: 'okay', email: $.EMAIL})
  browserid.verify({
    url: $.makeUrl('/good'),
    assertion: ASSERTION,
    audience: AUDIENCE,
  }, function (err, email) {
    t.same(email, $.EMAIL);
    t.end();
  });
});

test('verify: unparsable json', function (t) {
  $.mockHttp()
    .filteringRequestBody(/.*/, '*')
    .post('/bad', '*')
    .reply(200, 'unparseable')
  browserid.verify({
    url: $.makeUrl('/bad'),
    assertion: ASSERTION,
    audience: AUDIENCE,
  }, function (err, email) {
    t.same(err.code, 'parse-error');
    t.end();
  });
});

test('verify: bad http status', function (t) {
  $.mockHttp()
    .filteringRequestBody(/.*/, '*')
    .post('/bad', '*')
    .reply(500, 'down')
  browserid.verify({
    url: $.makeUrl('/bad'),
    assertion: ASSERTION,
    audience: AUDIENCE,
  }, function (err, email) {
    t.same(err.code, 'invalid-http-status');
    t.end();
  });
});

test('verify: bad verifier response', function (t) {
  $.mockHttp()
    .filteringRequestBody(/.*/, '*')
    .post('/bad', '*')
    .reply(200, { status: 'bad', reason: 'whatever' })
  browserid.verify({
    url: $.makeUrl('/bad'),
    assertion: ASSERTION,
    audience: AUDIENCE,
  }, function (err, email) {
    t.same(err.code, 'invalid-assertion');
    t.end();
  });
});

test('getAudience', function (t) {
  const req = {
    headers: {
      host: 'localhost'
    }
  };
  const aud = browserid.getAudience(req);
  t.same(aud, 'localhost');
  t.end();
});

test('getVerifierUrl', function (t) {
  const url = browserid.getVerifierUrl({
    identity: {
      protocol: 'https',
      server: 'localhost',
      path: '/verify'
    },
    get: function (key) { return this[key] }
  });
  t.same(url, 'https://localhost/verify');
  t.end();
});
