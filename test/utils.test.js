const test = require('tap').test;
const utils = require('../lib/utils');

function makeTestConf(opts) {
  function get(key) { return this[key] }
  opts.get = get;
  return opts;
}

test('utils#determinePort', function (t) {
  t.same(utils.determinePort(makeTestConf({
    protocol: 'http', port: '80',
  })), null);
  t.same(utils.determinePort(makeTestConf({
    protocol: 'https', port: '443',
  })), null);
  t.same(utils.determinePort(makeTestConf({
    protocol: 'http', port: 8000, remote_port: '80',
  })), null);
  t.same(utils.determinePort(makeTestConf({
    protocol: 'https', port: 8000, remote_port: '443',
  })), null);
  t.same(utils.determinePort(makeTestConf({
    protocol: 'https', port: 8000, remote_port: '445',
  })), 445);
  t.same(utils.determinePort(makeTestConf({
    protocol: 'https', port: 8000, remote_port: 'default',
  })), null);
  t.end();
});


test("utils#fullUrl", function(t) {
  const testConf = makeTestConf({
    protocol: 'http',
    port: '12',
    hostname: 'foo.org',
  });

  t.equal(utils.fullUrl("/api", testConf), "http://foo.org:12/api");
  t.equal(utils.fullUrl("api", testConf), "http://foo.org:12/api");
  t.equal(utils.fullUrl("http://bar.org/api", testConf), "http://bar.org/api");
  t.end();
});
test("utils#fullUrl: https", function(t) {
  const testConf = makeTestConf({
    protocol: 'https',
    remote_port: 'default',
    hostname: 'foo.org',
  });

  t.equal(utils.fullUrl("/api", testConf), "https://foo.org/api");
  t.equal(utils.fullUrl("api", testConf), "https://foo.org/api");
  t.equal(utils.fullUrl("http://bar.org/api", testConf), "http://bar.org/api");
  t.end();
});

test("utils#extendUrl adds querystring if not present", function(t) {
  t.equal(utils.extendUrl("http://foo.org", {blah: 1}),
          "http://foo.org/?blah=1");
  t.end();
});

test("utils#extendUrl merges into existing querystring", function(t) {
  t.equal(utils.extendUrl("http://foo.org/?k=2", {blah: 1}),
          "http://foo.org/?k=2&blah=1");
  t.end();
});
