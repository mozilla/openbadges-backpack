const test = require('tap').test;
const testUtils = require('./');
const baker = require('../lib/baker');
const path = require('path');

const PNGFILE = path.join(__dirname, '/utils/images/no-badge-data.png')

test('baker#prepare: fails if not given data', function (t) {
  try {
    baker.prepare(PNGFILE);
    t.fail('should have thrown');
  } catch (err) {
    t.ok(err, 'should have an error');
  }
  t.end();
});

test('baker#prepare: should work with valid data', function (t) {
  const url = 'https://exampe.org/badge';
  const badge = baker.prepare(PNGFILE, url);
  t.same(baker.getDataFromImage(badge), url);
  t.end();
});

testUtils.finish(test);