const _ = require('underscore');
const test = require('tap').test;
const testUtils = require('./');
const conmock = require('./conmock');
const issuer = require('../controllers/issuer');

const User = require('../models/user');
const Badge = require('../models/badge');

testUtils.prepareDatabase({
  '1-user': new User({ email: 'brian@example.org' }),
  '2-badge': new Badge({
    user_id: 1,
    type: 'hosted',
    endpoint: 'endpoint',
    image_path: 'image_path',
    body_hash: 'body_hash',
    body: testUtils.makeAssertion({})
  }),
}, function (fixtures) {
  test('issuer#validator: render when given no body', function (t) {
    conmock(issuer.validator, function (err, mock) {
      t.same(mock.status, 200);
      t.same(mock.fntype, 'render');
      t.end();
    });
  });

  test('issuer#validator: reporting errors', function (t) {
    const expect = [
      'recipient',
      'badge.version',
      'badge.name',
      'badge.description',
      'badge.criteria',
      'badge.image',
      'badge.issuer.origin',
      'badge.issuer.name'
    ].sort();

    t.test('html style', function (t) {
      conmock({
        handler: issuer.validator,
        request: {body: { assertion: '{}' }}
      }, function (err, mock) {
        const errors = _.pluck(mock.options.errors, 'field').sort();
        t.same(mock.fntype, 'render', 'should be a render call');
        t.same(errors, expect, 'should get expected errors');
        t.end();
      });
    });

    t.test('json style', function (t) {
      conmock({
        handler: issuer.validator,
        request: {
          body: { assertion: '{}'},
          headers: { accept: 'application/json' }
        }
      }, function (err, mock) {
        const errors = _.pluck(mock.body.errors, 'field').sort();
        t.same(mock.status, 400, 'should be an error');
        t.same(errors, expect, 'should get back the right errors');
        t.end();
      });
    });
  });

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
      t.same(mock.body, 'malformed url');
      t.end();
    });
  });


  testUtils.finish(test);
});

