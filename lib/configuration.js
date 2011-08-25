var config;
exports.get = function(val) {
  if (val === 'env') return process.env['NODE_ENV'];
  return config[val];
}

if (undefined === process.env['NODE_ENV']) {
  process.env['NODE_ENV'] = 'local';
}

try {
  config = require('./environments/' + process.env['NODE_ENV']).config;
} catch (e) {
  throw "unknown environment: " + exports.get('env');
}
