var config = {};
var overrides = {};
exports.set = function (key, val) {
  return overrides[key] = val;
}

exports.get = function (val, env) {
  if (overrides[val])
    return overrides[val];

  env = env || process.env['NODE_ENV'];
  if (val === 'env') return env;
  if (!config[env]) {
    var path = './environments/' + env;
    if (!exists(path)) {
      if (env !== 'local') { return exports.get(val, "local"); }
      else { throw new Error("unknown environment: " + env); }
    }
    config[env] = require(path).config;
    console.log(config);
  }
  return config[env][val];
};

function exists(file) {
  try {
    require(file);
    return true;
  } catch (e) {
    return false;
  }
}

if (undefined === process.env['NODE_ENV']) {
  process.env['NODE_ENV'] = 'development';
}
