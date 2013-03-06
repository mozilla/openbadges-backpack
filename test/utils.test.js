const test = require('tap').test;
const utils = require('../lib/utils');

var conf = require('../lib/configuration');

test("utils#fullUrl", function(t) {
  var originalConfGet = conf.get;
  var testConf = {protocol: 'http', port: '12', hostname: 'foo.org'};
  conf.get = function(name) { return testConf[name]; };

  try {
    t.equal(utils.fullUrl("/api"), "http://foo.org:12/api");
    t.equal(utils.fullUrl("api"), "http://foo.org:12/api");
    t.equal(utils.fullUrl("http://bar.org/api"), "http://bar.org/api");
  } finally {
    conf.get = originalConfGet;
  }

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
