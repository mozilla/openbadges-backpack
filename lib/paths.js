var path = require('path');

var fromRoot = exports.fromRoot = function fromRoot() {
  var fullPath = path.join.apply(this, arguments);
  return path.resolve(__dirname + '/..', fullPath);
};

exports.templateDir = fromRoot('template');
exports.staticDir = fromRoot('static');
exports.staticTestDir = fromRoot('test', 'browser');
