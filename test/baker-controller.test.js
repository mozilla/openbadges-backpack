const $ = require('./');
const test = require('tap').test;
const nock = require('nock');
const fs = require('fs');
const bakery = require('openbadges-bakery');
const baker = require('../controllers/baker');
const conmock = require('./conmock');
const User = require('../models/user');

const makeAssertion = $.makeAssertion;
const IMAGEDATA = fs.readFileSync(__dirname + '/utils/images/no-badge-data.png')

function makeRequestObj(url, award) {
  return {query: { assertion: $.makeUrl(url), award: award }};
}

$.prepareDatabase({
  '1-user': new User({
    email: $.EMAIL
  }),
}, function () {
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
      t.ok(mock.body.message.match(/valid/i), 'message should contain "valid"');
      t.end();
    });
  });

  test('well formed, but missing assertion', function (t) {
    $.mockHttp();
    conmock({
      handler: handler,
      request: makeRequestObj('/404')
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'application/json');
      t.same(mock.status, 400);
      t.same(mock.body.code, 'http-status');
      t.end();
    });
  });

  test('valid url, valid content type, unparseable json', function (t) {
    $.mockHttp();
    conmock({
      handler: handler,
      request: makeRequestObj('/criteria')
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'application/json');
      t.same(mock.status, 400);
      t.same(mock.body.code, 'parse');
      t.end();
    });
  });

  test('invalid assertion', function (t) {
    const assertion = $.makeNewAssertion();
    assertion.recipient = 'superchunk';
    $.mockHttp()
      .get('/assertion').reply(200, assertion);
    conmock({
      handler: handler,
      request: makeRequestObj('/assertion')
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'application/json');
      t.same(mock.status, 400);
      t.ok('recipient' in mock.body.extra.assertion, 'should be a recipient error');
      t.end();
    });
  });

  test('valid assertion, but the image 404s', function (t) {
    const assertion = $.makeNewAssertion();
    const badge = $.makeBadgeClass();
    assertion.badge = $.makeUrl('/bad-badge-image.json');
    badge.image = $.makeUrl('/404');
    $.mockHttp()
      .get('/assertion').reply(200, assertion)
      .get('/assertion').reply(200, assertion)
      .get('/bad-badge-image.json').reply(200, badge)
    conmock({
      handler: handler,
      request: makeRequestObj('/assertion')
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'application/json');
      t.same(mock.status, 400);
      t.ok('badge.image' in mock.body.extra, 'should be a badge image error');
      t.end();
    });
  });

  test('valid assertion, valid image', function (t) {
    const assertion = $.makeNewAssertion();
    const badge = $.makeBadgeClass();
    assertion.badge = $.makeUrl('/good-badge-image.json');
    badge.image = $.makeUrl('/badge-image.png');
    $.mockHttp()
      .get('/assertion').reply(200, assertion)
      .get('/assertion').reply(200, assertion)
      .get('/good-badge-image.json').reply(200, badge)
      .get('/badge-image.png').reply(200, IMAGEDATA, {'content-type': 'image/png'})
    conmock({
      handler: handler,
      request: makeRequestObj('/assertion')
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'image/png');
      t.same(mock.status, 200);
      bakery.extract(mock.body, function (err, data) {
        t.same(data, $.makeUrl('/assertion'));
        t.end();
      });
    });
  });

  test('valid assertion, awarding', function (t) {
    const assertion = $.makeNewAssertion();
    const badge = $.makeBadgeClass();
    assertion.badge = $.makeUrl('/good-badge-image.json');
    badge.image = $.makeUrl('/badge-image.png');
    $.mockHttp()
      .get('/assertion').reply(200, assertion)
      .get('/assertion').reply(200, assertion)
      .get('/good-badge-image.json').reply(200, badge)
      .get('/badge-image.png').reply(200, IMAGEDATA, {'content-type': 'image/png'})
    conmock({
      handler: handler,
      request: makeRequestObj('/assertion', $.EMAIL)
    }, function (err, mock) {
      t.same(mock.headers['Content-Type'], 'image/png');
      t.same(mock.headers['x-badge-awarded'], $.EMAIL);
      t.same(mock.status, 200);
      bakery.extract(mock.body, function (err, data) {
        t.same(data, $.makeUrl('/assertion'));
        t.end();
      });
    });
  });

  $.finish(test);
});

