const test = require('tap').test;
const testUtils = require('./');
const middleware = require('../middleware');
const conmock = require('./conmock');

const ALLOW_CORS = 'Access-Control-Allow-Origin';

test('middleware#cors', function (t) {
  const handler = middleware.cors;

  t.test('no cors by default', function (t) {
    conmock(handler(), function (err, mock) {
      t.notOk(mock.headers[ALLOW_CORS], 'should not allow cors');
      t.end();
    });
  });

  t.test('string whitelist', function (t) {
    const stringWhitelist = handler({ whitelist: '/foo' });

    conmock({
      handler: stringWhitelist,
      request: { url: '/foo' }
    }, function (err, mock) {
      t.same(mock.headers[ALLOW_CORS], '*', 'has cors');
    });

    conmock({
      handler: stringWhitelist,
      request: { url: '/food' }
    }, function (err, mock) {
      t.notOk(mock.headers[ALLOW_CORS], 'should not allow cors');
    });

    t.plan(2);
  });

  t.test('array whitelist', function (t) {
    const arrayWhitelist = handler({
      whitelist: ['/bar', '/baz']
    });
    conmock({
      handler: arrayWhitelist,
      request: { url: '/bar' }
    }, function (err, mock) {
      t.same(mock.headers[ALLOW_CORS], '*', 'has cors');
    });

    conmock({
      handler: arrayWhitelist,
      request: { url: '/baz' }
    }, function (err, mock) {
      t.same(mock.headers[ALLOW_CORS], '*', 'has cors');
    });

    conmock({
      handler: arrayWhitelist,
      request: { url: '/bard' }
    }, function (err, mock) {
      t.notOk(mock.headers[ALLOW_CORS], 'should not allow cors');
    });

    t.plan(3);
  });

  t.end();
});

// necessary because middleware requires mysql, which opens a client
testUtils.finish(test);