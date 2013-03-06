const test = require('tap').test;
const utils = require('../lib/utils');

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
