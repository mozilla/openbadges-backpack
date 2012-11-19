const test = require('tap').test;
const testUtils = require('./');
const nock = require('nock');
const fs = require('fs');
const baker = require('../controllers/baker');
const conmock = require('./conmock');

const makeAssertion = testUtils.makeAssertion;
const IMAGEDATA = fs.readFileSync(__dirname + '/utils/images/no-badge-data.png')

// Mock a bunch of http responses
// ------------------------------

const BASE = 'http://example.org';
const MISSING_JSON = '/missing.json';
const INVALID_JSON = '/invalid.json';
const INVALID_CONTENT_TYPE = '/invalid-content-type.json';
const MISSING_IMAGE = '/missing-image.json';
const LEGIT_REQUEST = '/legit.json';
const LEGIT_AND_AWARD = '/legit-and-award.json';
const INVALID_ASSERTION = '/invalid-assertion.json';
const EXAMPLE_EMAIL = 'brian@example.org';

function makeRequest(path) {
  return {query: {assertion: makeUrl(path)}};
}
function makeUrl(path) {
  return BASE + path;
}

nock(BASE)
  .intercept(MISSING_JSON, 'HEAD')
  .reply(404, '')
  .get(MISSING_JSON)
  .reply(404, '')

  .intercept(INVALID_JSON, 'HEAD')
  .reply(200, '')
  .get(INVALID_JSON)
  .reply(200, 'eeeeyyyyy', {'Content-Type': 'application/json'})

  .intercept(INVALID_CONTENT_TYPE, 'HEAD')
  .reply(200, '')
  .get(INVALID_CONTENT_TYPE)
  .reply(200, makeAssertion(), {'Content-Type': 'cheese/brie'})

  .intercept(MISSING_IMAGE, 'HEAD')
  .reply(200, '')
  .get(MISSING_IMAGE)
  .reply(200, makeAssertion({
    'badge.image': makeUrl('/image-not-found.png')
  }), { 'Content-Type': 'application/json' })

  .intercept('/image-not-found.png', 'HEAD')
  .reply(404, '')
  .get('/image-not-found.png')
  .reply(404, '')

  .intercept(LEGIT_REQUEST, 'HEAD')
  .reply(200, '')
  .get(LEGIT_REQUEST)
  .reply(200, makeAssertion({
    'badge.image': makeUrl('/image.png'),
    'recipient': EXAMPLE_EMAIL
  }), { 'Content-Type': 'application/json' })

  .intercept('/image.png', 'HEAD')
  .reply(200, '', { 'Content-Type': 'image/png' })
  .get('/image.png')
  .reply(200, IMAGEDATA, { 'Content-Type': 'image/png' })

  .intercept(LEGIT_AND_AWARD, 'HEAD').reply(200, '')
  .get(LEGIT_AND_AWARD)
  .reply(200, makeAssertion({
    'badge.image': makeUrl('/image-award.png'),
    'recipient': EXAMPLE_EMAIL
  }), { 'Content-Type': 'application/json' })

  .intercept('/image-award.png', 'HEAD')
  .reply(200, '', { 'Content-Type': 'image/png' })
  .get('/image-award.png')
  .reply(200, IMAGEDATA, { 'Content-Type': 'image/png' })

  .intercept(INVALID_ASSERTION, 'HEAD')
  .reply(200, '')
  .get(INVALID_ASSERTION)
  .reply(200, makeAssertion({
    'badge.image': makeUrl('/image.png'),
    // invalid content for email
    'recipient': 'example.com'
  }), { 'Content-Type': 'application/json' })


testUtils.prepareDatabase(function () {
  const handler = baker.baker;
  test('without an assertion', function (t) {
    conmock(handler, function (err, mock) {
      t.same(mock.fntype, 'render', 'should try to render');
      t.same(mock.status, 200, 'should be 200');
      t.end();
    });
  });

  test('bogus assertion url', function (t) {
    const request = {query: {assertion: 'lol'}};
    conmock({
      handler: handler,
      request: request
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'application/json');
      t.same(mock.status, 400);
      t.ok(mock.body.match(/unreachable/i), 'should be unreachable');
      t.end();
    });
  });

  test('well formed, but missing assertion', function (t) {
    const request = makeRequest(MISSING_JSON);
    conmock({
      handler: handler,
      request: request
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'application/json');
      t.same(mock.status, 400);
      t.ok(mock.body.match(/unreachable/i), 'should be unreachable');
      t.end();
    });
  });

  test('valid url, invalid content type', function (t) {
    const request = makeRequest(INVALID_CONTENT_TYPE);
    conmock({
      handler: handler,
      request: request
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'application/json');
      t.ok(mock.body.match(/content-type/i), 'should be content type error');
      t.same(mock.status, 400);
      t.end();
    });
  });

  test('valid url, valid content type, unparseable json', function (t) {
    const request = makeRequest(INVALID_JSON);
    conmock({
      handler: handler,
      request: request
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'application/json');
      t.ok(mock.body.match(/ParseError/i), 'should be parse error');
      t.same(mock.status, 400);
      t.end();
    });
  });

  test('invalid assertion', function (t) {
    const request = makeRequest(INVALID_ASSERTION);
    conmock({
      handler: handler,
      request: request
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'application/json');
      t.ok(mock.body.match(/recipient/i), 'should have error with recipient');
      t.same(mock.status, 400);
      t.end();
    });
  });

  test('valid assertion, but the image 404s', function (t) {
    const request = makeRequest(MISSING_IMAGE);
    conmock({
      handler: handler,
      request: request
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'application/json');
      t.ok(mock.body.match(/unreachable/i), 'should be unreachable');
      t.same(mock.status, 400);
      t.end();
    });
  });

  test('valid assertion, valid image', function (t) {
    const request = makeRequest(LEGIT_REQUEST);
    conmock({
      handler: handler,
      request: request
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'image/png');
      t.same(mock.status, 200);
      t.end();
    });
  });

  test('valid assertion, valid image, trying to award', function (t) {
    const request = makeRequest(LEGIT_AND_AWARD);
    request.query.award = EXAMPLE_EMAIL;
    conmock({
      handler: handler,
      request: request
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'image/png');
      t.same(mock.headers['x-badge-awarded'], EXAMPLE_EMAIL);
      t.same(mock.status, 200);
      t.end();
    });
  });

  testUtils.finish(test);
});

