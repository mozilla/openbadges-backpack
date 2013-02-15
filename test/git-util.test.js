const test = require('tap').test;
const path = require('path');
const gitUtil = require('../lib/git-util.js');

var sha = 'abcde12345abcde12345abcde12345abcde12345';

test('handles branch head', function (t) {
  var sha = gitUtil.findSHA(path.join(__dirname, 'data/git-util/HEAD-REF'));
  t.same(sha, 'abcde12345abcde12345abcde12345abcde12345');
  t.end();
});

test('handles detached head', function (t) {
  var head = path.join(__dirname, 'data/git-util/HEAD-SHA');
  var sha = gitUtil.findSHA(head);
  t.same(sha, 'abcde12345abcde12345abcde12345abcde12345');
  t.end();
});

test('.git/HEAD read error', function (t) {
  var head = path.join(__dirname, 'data/git-util/NOTTHERE');
  try {
    gitUtil.findSHA(head);
    t.fail();
  }
  catch (err) {
    t.ok(err, 'got an error');
    t.same(err.message, 'Could not read HEAD file: ' + head);
  }
  t.end();
});

test('refs/heads/branchname read error', function (t) {
  var head = path.join(__dirname, 'data/git-util/HEAD-BAD-REF');
  var ref = path.resolve(path.join(__dirname, 'data/git-util/refs/heads/notthere')); 
  try {
    gitUtil.findSHA(head);
    t.fail();
  }
  catch (err) {
    t.ok(err, 'got an error');
    t.same(err.message, 'Could not read ref file: ' + ref);
  }
  t.end();
});

test('unknown .git/HEAD error', function (t) {
  var head = path.join(__dirname, 'data/git-util/HEAD-UNEXPECTED');
  try {
    gitUtil.findSHA(head);
    t.fail();
  }
  catch (err) {
    t.ok(err, 'got an error');
    t.same(err.message, 'Unable to parse HEAD file: ' + head);
  }
  t.end();
});
