const $ = require('./');
const fs = require('fs');
const jws = require('jws');
const test = require('tap').test;
const nock = require('nock');
const keys = require('./test-keys');
const analyzeAssertion = require('../lib/analyze-assertion');

test('analyzeAssertion: valid old assertion', function (t) {
  $.mockHttp();
  analyzeAssertion($.makeOldAssertion(), function (err, info) {
    t.notOk(err, 'no errors');
    t.same(info.version, '0.5.0');
    t.end();
  });
});

test('analyzeAssertion: invalid old assertion, bad form', function (t) {
  $.mockHttp();
  const assertion = $.makeOldAssertion();
  delete assertion.badge.criteria;
  delete assertion.badge.image;
  analyzeAssertion(assertion, function (err, info) {
    t.same(err.code, 'structure');
    t.ok(err.extra['badge.image'], 'should have image error');
    t.end();
  });
});

test('analyzeAssertion: valid old assertion, url', function (t) {
  const assertion = $.makeOldAssertion();
  $.mockHttp()
    .get('/assertion').reply(200, JSON.stringify(assertion), { 'content-type': 'application/json' })
  analyzeAssertion($.makeUrl('/assertion'), function (err, info) {
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
  $.mockHttp()
    .get('/404').reply(404)
    .get('/500').reply(500)
  t.plan(4);
  analyzeAssertion($.makeUrl('/404'), function (err, info) {
    t.same(err.code, 'http-status');
    t.same(err.extra, 404);
  });
  analyzeAssertion($.makeUrl('/500'), function (err, info) {
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
  const assertion = $.makeNewAssertion();
  $.mockHttp()
    .get('/assertion').reply(200, JSON.stringify(assertion))
  analyzeAssertion(assertion, function (err, info) {
    t.notOk(err, 'no errors')
    t.same(info.version, '1.0.0');
    t.same(info.structures.assertion, assertion);
    t.end();
  });
});

test('analyzeAssertion: new assertion, signed', function (t) {
  const signature = $.makeSignature();
  analyzeAssertion(signature, function (err, info) {
    t.notOk(err, 'no errors');
    t.same(info.version, '1.0.0');
    t.same(signature, info.signature);
    t.same(info.structures.assertion.uid, 'f2c20');
    t.end();
  });
});

