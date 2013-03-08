const $ = require('./');
const _ = require('underscore');
const test = require('tap').test;
const conmock = require('./conmock');
const issuer = require('../controllers/issuer');

const User = require('../models/user');
const Badge = require('../models/badge');

$.prepareDatabase({
  '1-user': new User({ email: 'brian@example.org' }),
  '2-badge': new Badge({
    user_id: 1,
    endpoint: 'endpoint',
    image_path: 'image_path',
    body_hash: 'body_hash',
    body: $.makeAssertion({})
  }),
}, function (fixtures) {

  test('issuer#welcome: no user', function (t) {
    conmock(issuer.welcome, function (err, mock) {
      t.same(mock.fntype, 'redirect');
      t.same(mock.path, '/backpack/login');
      t.end();
    });
  });

  test('issuer#welcome: some sorta user', function (t) {
    const user = fixtures['1-user'];
    const request = { user: user };
    conmock({
      handler: issuer.welcome,
      request: request,
    }, function (err, mock) {
      t.same(mock.fntype, 'redirect', 'should be a redirect');
      t.same(mock.path, '/', 'path should be the index');
      t.end();
    });
  });

  test('issuer#frame', function (t) {
    conmock(issuer.frame, function (err, mock) {
      t.same(mock.fntype, 'render', 'should be a render');
      t.same(mock.options.framed, true, 'should be framed');
      t.end();
    });
  });

  test('issuer#frameless: no assertions', function (t) {
    const request = {body: { assertions: [] }};
    conmock({
      handler: issuer.frameless,
      request: request,
    }, function (err, mock) {
      t.same(mock.fntype, 'render', 'should be a render');
      t.same(mock.options.framed, false, 'should not be framed');
      t.same(mock.options.assertions, '[]', 'should have no assertions');
      t.end();
    });
  });

  test('issuer#frameless: good assertions', function (t) {
    const urls = [
      'http://example.org/something-good',
      'http://example.org/other-good-thing'
    ];
    const request = {body: { assertions: urls }};
    conmock({
      handler: issuer.frameless,
      request: request,
    }, function (err, mock) {
      t.same(mock.fntype, 'render')
      t.same(mock.options.assertions, JSON.stringify(urls),
             'should have some good assertions');
      t.end();
    });
  });

  test('issuer#frameless: bad assertion', function (t) {
    const urls = [
      'bad!',
      'http://example.org/something-good',
      'http://example.org/other-good-thing'
    ];
    const request = {body: { assertions: urls }};
    conmock({
      handler: issuer.frameless,
      request: request,
    }, function (err, mock) {
      t.same(mock.fntype, 'send');
      t.same(mock.status, 400);
      t.end();
    });
  });


  $.finish(test);
});

