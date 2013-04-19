var test = require('tap').test;
var atu = require('../acceptance-test/acceptance-test-utils');

var bindAction = atu._forTesting.bindAction;
var collapseWhitespace = atu._forTesting.collapseWhitespace;

test('bindAction() works', function(t) {
  function foo(a, b, cb) {
    process.stdout.write("FOO CALLED WITH " + a + " " + b + " " + cb + "\n");
    cb(null, a+b);
    return "just called cb(null, " + (a+b) + ")";
  }

  var boundFoo = bindAction(2, foo);
  var boundFoo3 = boundFoo(3);

  t.same(typeof(boundFoo), 'function');
  t.same(typeof(boundFoo3), 'function');
  t.same(typeof(boundFoo3(function(){})), 'string');
  t.same(boundFoo3(function(){}), 'just called cb(null, 5)');
  t.same(typeof(boundFoo(3, function(){})), 'string');
  t.same(boundFoo(3, function(){}), 'just called cb(null, 5)');

  boundFoo3(function(err, result) {
    t.same(result, 5);
    boundFoo(3, function(err, result) {
      t.same(result, 5);
      t.end();
    });
  });
});

test('collapseWhitespace() works', function(t) {
  t.same(collapseWhitespace('a b'), 'a b');
  t.same(collapseWhitespace('a\nb'), 'a b');
  t.same(collapseWhitespace('a\n\nb'), 'a b');
  t.same(collapseWhitespace('a\n  \n b'), 'a b');
  t.same(collapseWhitespace('   a\n   b'), ' a b');
  t.end();
});
