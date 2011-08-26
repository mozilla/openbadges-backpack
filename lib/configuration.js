var config = {};
exports.get = function(val) {
  var env = process.env['NODE_ENV'];
  if (val === 'env') return env;
  if (!config[env]) { 
    try {
      config[env] = require('./environments/' + process.env['NODE_ENV']).config;
    } catch (e) {
      throw "unknown environment: " + exports.get('env');
    }
  }
  return config[env][val]
}

if (undefined === process.env['NODE_ENV']) {
  process.env['NODE_ENV'] = 'local';
}
