const test = require('tap').test;
const testUtils = require('./');
const remote = require('../lib/remote');

const TOO_BIG = remote.MAX_RESPONSE_SIZE + 1;

// #FIXME: These are not really great tests. We test the internals
// of remote rather than testing the public interface

function mockResponse(status, length, type) {
  const res = {};
  res.statusCode = status || 200;
  res.headers = {};
  res.headers['content-length'] = length || 0;
  res.headers['content-type'] = type || 'text/html';
  return res;
}

function testThrows(t, fn, errorName) {
  try {
    fn();
    t.fail('should have thrown');
  } catch (err) {
    t.same(err.name, errorName, 'should have ' + errorName);
  }
}

function testDoesNotThrow(t, fn) {
  try {
    fn();
    t.pass('did not throw')
  } catch (err) {
    t.fail('unexpected error:' + err.message);
  }
}

test('remote.assert.reachable', function (t) {
  testThrows(t, function () {
    remote.assert.reachable(null, mockResponse(500));
  }, 'UnreachableError');
  t.end();

  testDoesNotThrow(t, function () {
    remote.assert.reachable(null, mockResponse(200));
    remote.assert.reachable(null, mockResponse(304));
    remote.assert.reachable(null, mockResponse(301));
  });
});

test('remote.assert.size', function (t) {
  const TOO_BIG_BODY = testUtils.randomstring(TOO_BIG);
  const MODERATELY_SIZED_BODY = testUtils.randomstring(TOO_BIG-1);
  testThrows(t, function () {
    const res = mockResponse(200, TOO_BIG);
    remote.assert.size(res);
  }, 'SizeError');

  testThrows(t, function () {
    const res = mockResponse(200);
    remote.assert.size(res, TOO_BIG_BODY)
  }, 'SizeError');

  testDoesNotThrow(t, function () {
    const res = mockResponse(200, TOO_BIG - 1);
    remote.assert.size(res, MODERATELY_SIZED_BODY);
  });
  t.end();
});

test('remote.assert.contentType', function (t) {
  testThrows(t, function () {
    const res = mockResponse(200, 0, 'application/json');
    remote.assert.contentType(res, 'text/html');
  }, 'ContentTypeError');

  testDoesNotThrow(t, function () {
    const res = mockResponse(200, 0, 'application/json');
    remote.assert.contentType(res, 'application/json');
  });
  t.end();

});

testUtils.finish(test);
