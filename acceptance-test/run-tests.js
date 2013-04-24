const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const test = require('tap').test;

var rootDir = path.dirname(__dirname);
var node = process.argv[0];
var testFiles = fs.readdirSync(__dirname).filter(function(filename) {
  return filename.match(/\.atest\.js$/);
});

testFiles.forEach(function(filename) {
  test("acceptance test '" + filename + "'", function(t) {
    process.stdout.write("Spawning new process for '" + filename + "'.\n");
    var child = spawn(node, [path.join(__dirname, filename)], {
      cwd: rootDir
    });
    child.stdout.on('data', function(data) {
      process.stdout.write(data);
    });
    child.stderr.on('data', function(data) {
      process.stderr.write(data);
    });
    child.on('exit', function(code, signal) {
      process.stdout.write("Process for '" + filename + "' exited " +
                           "with code " + code + ".\n");
      t.same(code, 0, "return code of '" + filename + "' should be 0");
      t.end();
    });
  });
});
