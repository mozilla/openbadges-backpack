var fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn;

var testFiles = fs.readdirSync(__dirname).filter(function(filename) {
  return filename.match(/-test\.js$/);
});

var rootDir = path.dirname(__dirname);
var node = process.argv[0];
var results = {};
var anyErrors = false;

function runNextTest() {
  if (testFiles.length) {
    var filename = testFiles.pop();
    var child = spawn(node, [path.join(__dirname, filename)], {
      cwd: rootDir
    });
    console.log("Running test", filename);
    child.stdout.on('data', function(data) {
      process.stdout.write(data);
    });
    child.stderr.on('data', function(data) {
      process.stderr.write(data);
    });
    child.on('exit', function(code, signal) {
      if (code) {
        console.log("Test", filename, "was unsuccessful.");
        anyErrors = true;
      } else {
        console.log("Test", filename, "was successful.");
      }
      results[filename] = code;
      runNextTest();
    });
  } else {
    console.log("Tests completed.");
    for (var testName in results) {
      console.log(testName, results[testName] ? "FAILED" : "OK");
    }
    if (anyErrors) {
      console.log("Some tests were unsuccessful.");
      process.exit(1);
    } else {
      console.log("All tests were successful.");
      process.exit(0);
    }
  }
}

runNextTest();
