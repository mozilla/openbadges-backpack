const util = require('util');
console.log = function() {
  process.stderr.write(util.format.apply(this, arguments) + '\n');
};
console.dir = function(object) {
  process.stderr.write(util.inspect(object) + '\n');
};
