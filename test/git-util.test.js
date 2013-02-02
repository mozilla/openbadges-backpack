const test = require('tap').test;
const path = require('path');
const gitUtil = require('../lib/git-util.js');

var sha = 'abcde12345abcde12345abcde12345abcde12345';

var fs = {
  fileContents: {},
  readFile: function(path, encoding, cb) {
    var keys = Object.keys(this.fileContents);
    for (var i = 0; i < keys.length; i++) {
      var re = new RegExp(keys[i]);
      if (re.test(path)) {
        var val = this.fileContents[keys[i]];
        cb(val.err, val.contents);
        return;
      }
    }
  }
};

test('handles branch head', function (t) {
  fs.fileContents = {
    '.git/HEAD': { contents: 'ref: refs/heads/branchname' },
    'refs/heads/branchname':  { contents: sha }
  };

  gitUtil.findSHA(function(err, sha) {
    t.same(sha, 'abcde12345abcde12345abcde12345abcde12345');
    t.end();
  }, fs);
});

test('handles detached head', function (t) {
  fs.fileContents = {
    '.git/HEAD': { contents: sha }
  };

  gitUtil.findSHA(function(err, sha) {
    t.same(sha, 'abcde12345abcde12345abcde12345abcde12345');
    t.end();
  }, fs);
});

test('.git/HEAD read error', function (t) {
  fs.fileContents = {
    '.git/HEAD': { err: 'asplode' }
  };

  gitUtil.findSHA(function(err, sha) {
    t.same(err, 'asplode');
    t.end();
  }, fs);
});

test('refs/heads/branchname read error', function (t) {
  fs.fileContents = {
    '.git/HEAD': { contents: 'ref: refs/heads/branchname' },
    'refs/heads/branchname': { err: 'asplode' }
  };

  gitUtil.findSHA(function(err, sha) {
    t.same(err, 'asplode');
    t.end();
  }, fs);
});

test('unknown .git/HEAD error', function (t) {
  fs.fileContents = {
    '.git/HEAD': { contents: 'something unknown' }
  };

  gitUtil.findSHA(function(err, sha) {
    t.ok(err);
    t.same(err.message, 'Unable to parse .git/HEAD');
    t.end();
  }, fs);
});
